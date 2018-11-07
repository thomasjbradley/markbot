(function () {
  'use strict';

  const MIN_WINDOW_HEIGHT = 400;
  const MAX_WINDOW_HEIGHT = 4000;
  const MAX_WINDOW_WIDTH = 2500;

  const fs = require('fs');
  const path = require('path');
  const fork = require('child_process').fork;
  const exec = require('child_process').exec;
  const jimp = require('jimp');
  const BrowserWindow = require('electron').remote.BrowserWindow;
  const ipcRenderer = require('electron').ipcRenderer;
  const markbotMain = require('electron').remote.require('./app/markbot-main');
  const fileExists = require(__dirname + '/file-exists');
  const webLoader = require(__dirname + '/web-loader');
  const classify = require(__dirname + '/classify');
  const escapeShell = require(`${__dirname}/escape-shell`);
  const convertToUrl = require(`${__dirname}/convert-path-to-url`);
  const functionalityInjector = require(__dirname + '/functionality-injector');
  const screenshotNamingService = require(__dirname + '/checks/screenshots/naming-service');
  const defaultsService = require(__dirname + '/checks/screenshots/defaults-service');
  const defaultScreenshotCSS = defaultsService.get('default.css');
  const defaultScreenshotJS = defaultsService.get('default.js');

  const group = taskDetails.group;
  const folderPath = taskDetails.cwd;

  let totalFiles = 0;

  const getResizeInjectionJs = function (windowId, taskRunnerId, ipcListenerChannel) {
    return `
      (function (windowId, taskRunnerId, listenerLabel) {
        'use strict';

        ${defaultScreenshotJS}

      }(${windowId}, ${taskRunnerId}, '${ipcListenerChannel}'));
    `;
  };

  const getCropHeight = function (height) {
    if (height > MAX_WINDOW_HEIGHT) return MAX_WINDOW_HEIGHT;
    if (height < MIN_WINDOW_HEIGHT) return MIN_WINDOW_HEIGHT;

    return height;
  };

  const saveScreenshot = function (fullPath, width, img, next) {
    if (width === 'print') {
      const pdfFullPath = fullPath.replace(/png$/, 'pdf');
      fs.writeFile(pdfFullPath, img, () => {
        const pdfHelperPath = path.resolve(__dirname.replace(/app.asar[\/\\]/, 'app.asar.unpacked/') + '/../vendor/pdfbox');
        const execPath = 'java -jar ' + escapeShell(pdfHelperPath + '/pdfbox-app.jar') + ' PDFToImage -imageType png -page 1 -outputPrefix ' + convertToUrl(fullPath.replace(/\.png$/, '')) + ' ' + pdfFullPath;

        exec(execPath, function (err, data) {
          fs.rename(fullPath.replace(/\.png$/, '1.png'), fullPath, (err) => {
            next(fullPath);
          });
        });
      });
    } else {
      let imgSize = img.getSize();

      // Handle screenshots taken on retina displays
      if (imgSize.width > width) {
        let resiezdImage = img.resize({
          width: width,
          quality: 'best',
        });
        fs.writeFile(fullPath, resiezdImage.toPNG(), () => { next(fullPath); });
      } else {
        fs.writeFile(fullPath, img.toPNG(), function () { next(fullPath); });
      }
    }
  };

  const takeScreenshotAtSize = function (windowId, width, height, next) {
    const win = BrowserWindow.fromId(windowId);

    // win.setContentSize(width, height);
    // win.capturePage(next);
    if (width === 'print') {
      win.webContents.printToPDF({printBackground: true}, (err, data) => { next(data); });
    } else {
      win.capturePage({x: 0, y:0, width: width, height: getCropHeight(height)}, next);
    }
  };

  const diffScreenshot = function (fullPath, file, group, filename, width, next) {
    let differ = fork(`${__dirname}/checks/screenshots/differ`);

    differ.on('message', function (message) {
      switch (message.type) {
        case 'kill':
          differ.kill();
          differ = null;
          break;
        case 'debug':
          markbotMain.debug(message.debug.join(' '));
          break;
        default:
          if (message.messages) {
            markbotMain.send(message.id, group, message.checkId, message.checkLabel, false, message.messages);
          } else {
            markbotMain.send(message.id, group, message.checkId, message.checkLabel, message.errors);
          }
          next(filename, width);
          break;
      }
    });

    differ.send({
      type: 'init',
      filename: filename,
      width: width
    });

    differ.send({
      type: 'check',
      paths: {
        new: screenshotNamingService.getScreenshotPath(fullPath, filename, width, false),
        ref: screenshotNamingService.getScreenshotPath(fullPath, filename, width, true)
      },
      allowedDiff: (Array.isArray(file.sizes)) ? false : (parseInt(file.sizes[width], 10) / 100),
    });
  };

  const check = function (fullPath, file, next) {
    const pagePath = path.resolve(fullPath + '/' + file.path);
    const idExtra = (file.label) ? `-${file.label}` : '';
    const labelExtra = (file.label) ? ` — ${file.label}` : '';
    const ipcListenerLabel = classify(`${file.path}-${Date.now()}`);
    const ipcListenerResizeChannel = `__markbot-screenshots-resized-${ipcListenerLabel}`;
    const screenshotFilename = screenshotNamingService.makeScreenshotBasename(file);
    const listenerId = function (size) { return `${screenshotFilename}-${size}`; };
    const listenerLabel = function (size) { return `${file.path}: ${size}px${labelExtra}`; };
    let screenshotSizes = (Array.isArray(file.sizes)) ? file.sizes.slice(0) : Object.keys(file.sizes);
    let screenshotSizesDiffing = [];
    let screenshotSizesDone = [];
    let printingPage = false;
    let printResizeWidthIgnore = 1900;

    const getWindowHeight = function (width) {
      const aspectRatio = 0.5625;

      return Math.round((width < 600) ? width * (1 + aspectRatio) : width * aspectRatio);
    };

    const nextScreenshot = function (windowId) {
      let nextScreenshot = screenshotSizes.shift();
      let nextSize;

      printingPage = false;

      if (nextScreenshot === 'print') {
        printingPage = true;
        nextSize = 'print';
      } else {
        nextSize = parseInt(nextScreenshot, 10);
      }

      if (nextSize) {
        markbotMain.send('check-group:item-computing', group, listenerId(nextSize), listenerLabel(nextSize));

        if (nextSize === 'print') {
          handleResizedBrowserWindow(windowId, 'print', MAX_WINDOW_HEIGHT);
        } else {
          BrowserWindow.fromId(windowId).setSize(nextSize, MAX_WINDOW_HEIGHT);
        }
        // BrowserWindow.fromId(windowId).setSize(nextSize, getWindowHeight(nextSize));
      } else {
        cleanup(windowId);
      }
    };

    const failAllScreenshots = function (reason) {
      screenshotSizes.forEach((width) => {
        markbotMain.send('check-group:item-complete', group, listenerId(width), listenerLabel(width), [`The website isn’t functioning as expected: ${reason}`]);
      });
    };

    const checkAllDiffsDone = function () {
      let allScreenshotSizes = (Array.isArray(file.sizes)) ? file.sizes.slice(0) : Object.keys(file.sizes);
      if (screenshotSizesDone.length >= allScreenshotSizes.length) next();
    };

    const cleanup = function (windowId) {
      let win = BrowserWindow.fromId(windowId);

      ipcRenderer.removeAllListeners(ipcListenerResizeChannel);
      ipcRenderer.removeAllListeners('__markbot-functionality-error');
      ipcRenderer.removeAllListeners('__markbot-functionality-test-done-' + ipcListenerLabel);
      ipcRenderer.removeAllListeners('__markbot-functionality-test-fail-' + ipcListenerLabel);
      ipcRenderer.removeAllListeners('__markbot-functionality-test-debug-' + ipcListenerLabel);

      webLoader.destroy(win);
      win = null;
    };

    const handleResizedBrowserWindow = function (windowId, width, height) {
      if (screenshotSizesDiffing.indexOf(width) >= 0) return;

      screenshotSizesDiffing.push(width);

      takeScreenshotAtSize(windowId, width, height, function (img) {
        let imagePath = screenshotNamingService.getScreenshotPath(fullPath, screenshotFilename, width);

        saveScreenshot(imagePath, width, img, function () {
          if (fileExists.check(screenshotNamingService.getScreenshotPath(fullPath, screenshotFilename, width, true))) {
            diffScreenshot(fullPath, file, group, screenshotFilename, width, function (f, w) {
              if (screenshotSizesDone.indexOf(f + w) < 0) screenshotSizesDone.push(f + w);
              checkAllDiffsDone();
            });
          } else {
            markbotMain.send('check-group:item-complete', group, listenerId(width), listenerLabel(width), [`Reference screenshot not found in the “${screenshotNamingService.REFERENCE_SCREENSHOT_FOLDER}” folder`]);
            next();
          }

          if (screenshotSizes.length > 0) {
            nextScreenshot(windowId);
          } else {
            cleanup(windowId);
          }
        });
      });
    }

    ipcRenderer.on(ipcListenerResizeChannel, function (event, windowId, width, height) {
      // This is a super hack to work around the fact that the resize event is fired when a document is printed
      if (printingPage && width === printResizeWidthIgnore) return;
      handleResizedBrowserWindow(windowId, width, height);
    });

    ipcRenderer.on('__markbot-functionality-error', function (event, message, line, filename) {
      filename = filename.replace(fullPath, '').replace('file:///', '');
      cleanup(windowId);

      if (message) message = message.replace(/\.$/, '');
      if (filename) filename = filename.replace(/https?:\/\/(localhost|127\.0\.0\.1):?\d+\//, '');

      if (message && !filename && !line) markbotMain.debug(message);
      if (message && filename && !line) markbotMain.debug(`${message} — \`${filename}\``);
      if (message && filename && line) markbotMain.debug(`${message} — \`${filename}\` on line ${line}`);
    });

    ipcRenderer.on('__markbot-functionality-test-done-' + ipcListenerLabel, function(event, windowId) {
      nextScreenshot(windowId);
    });

    ipcRenderer.on('__markbot-functionality-test-fail-' + ipcListenerLabel, function(event, reason, windowId) {
      cleanup(windowId);
      failAllScreenshots(reason);
      next();
    });

    ipcRenderer.on('__markbot-functionality-test-debug-' + ipcListenerLabel, function (event, ...e) {
      markbotMain.debug(...e);
    });

    if (!fileExists.check(pagePath)) {
      screenshotSizes.forEach(function (size) {
        markbotMain.send('check-group:item-new', group, listenerId(size), listenerLabel(size));
        markbotMain.send('check-group:item-complete', group, listenerId(size), listenerLabel(size), [`Screenshots couldn’t be captured — \`${file.path}\` is missing or misspelled`]);
        next();
      });
      return;
    } else {
      screenshotSizes.forEach(function (size) {
        markbotMain.send('check-group:item-new', group, listenerId(size), listenerLabel(size));
      });
    }

    webLoader.load(taskRunnerId, file.path, {width: MAX_WINDOW_WIDTH, height: MAX_WINDOW_HEIGHT}, function (theWindow) {
      if (!file.allowAnimations) theWindow.webContents.insertCSS(defaultScreenshotCSS);

      theWindow.webContents.executeJavaScript(getResizeInjectionJs(theWindow.id, taskRunnerId, ipcListenerResizeChannel), function (windowId) {
        if (file.before) {
          functionalityInjector.runCode(theWindow, file.before, 0, ipcListenerLabel);
        } else {
          if (file.allowAnimations) theWindow.webContents.executeJavaScript(`window.__markbot.playAnimations();`);
          nextScreenshot(windowId);
        }
      });
    });
  };

  const checkIfDone = function () {
    totalFiles--;

    if (totalFiles <= 0) done();
  };

  taskDetails.options.files.forEach(function (file) {
    totalFiles++;
    check(folderPath, file, checkIfDone);
  });

}());
