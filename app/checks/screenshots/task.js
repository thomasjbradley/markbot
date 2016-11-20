(function () {
  'use strict';

  const MIN_WINDOW_HEIGHT = 400;
  const MAX_WINDOW_HEIGHT = 6000;
  const MAX_WINDOW_WIDTH = 3000;

  const fs = require('fs');
  const path = require('path');
  const fork = require('child_process').fork;
  const ipcRenderer = require('electron').ipcRenderer;
  const BrowserWindow = require('electron').remote.BrowserWindow;
  const jimp = require('jimp');
  const fileExists = require('./file-exists');
  const webLoader = require('./web-loader');
  const screenshotNamingService = require('./checks/screenshots/naming-service');
  const defaultScreenshotCSS = fs.readFileSync(path.resolve(__dirname + '/checks/screenshots/default.css'), 'utf8');
  const defaultScreenshotJS = fs.readFileSync(path.resolve(__dirname + '/checks/screenshots/default.js'), 'utf8');
  const classify = require('./classify');
  const markbotMain = require('electron').remote.require('./app/markbot-main');

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
    let imgSize = img.getSize();

    // Handle screenshots taken on retina displays
    if (imgSize.width > width) {
      jimp.read(img.toPng(), function (err, image) {
        image
          .resize(width, jimp.AUTO)
          .rgba(false)
          .write(fullPath, function () {
            next(fullPath);
          })
          ;
      });
    } else {
      fs.writeFile(fullPath, img.toPng(), function () {
        next(fullPath);
      });
    }
  };

  const takeScreenshotAtSize = function (windowId, width, height, next) {
    const win = BrowserWindow.fromId(windowId);

    win.capturePage({x: 0, y:0, width: width, height: getCropHeight(height)}, next);
  };

  const diffScreenshot = function (fullPath, group, filename, width, next) {
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
            markbotMain.send(message.id, group, message.checkId, message.checkLabel, [], '', message.messages);
          } else {
            markbotMain.send(message.id, group, message.checkId, message.checkLabel, message.errors);
          }
          next(width);
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
      }
    });
  };

  const check = function (fullPath, file, next) {
    const pagePath = path.resolve(fullPath + '/' + file.path);
    const ipcListenerLabel = classify(`${file.path}-${Date.now()}`);
    const ipcListenerResizeChannel = `__markbot-screenshots-resized-${ipcListenerLabel}`;
    const listenerId = function (size) { return `${file.path}-${size}`; };
    const listenerLabel = function (size) { return `${file.path} — ${size}px`; };
    let screenshotSizes = file.sizes.slice();
    let screenshotSizesDone = [];

    const nextScreenshot = function (windowId) {
      let nextSize = screenshotSizes.shift();

      if (nextSize) {
        markbotMain.send('check-group:item-computing', group, listenerId(nextSize), listenerLabel(nextSize));
        BrowserWindow.fromId(windowId).setSize(nextSize, MAX_WINDOW_HEIGHT);
      } else {
        cleanup(windowId);
      }
    };

    const checkAllDiffsDone = function () {
      if (screenshotSizesDone.length >= file.sizes.length) next();
    };

    const cleanup = function (windowId) {
      let win = BrowserWindow.fromId(windowId);

      ipcRenderer.removeAllListeners(ipcListenerResizeChannel);

      webLoader.destroy(win);
      win = null;
    };

    ipcRenderer.on(ipcListenerResizeChannel, function (event, windowId, width, height) {
      takeScreenshotAtSize(windowId, width, height, function (img) {
        let imagePath = screenshotNamingService.getScreenshotPath(fullPath, file.path, width);

        saveScreenshot(imagePath, width, img, function () {
          if (fileExists.check(screenshotNamingService.getScreenshotPath(fullPath, file.path, width, true))) {
            diffScreenshot(fullPath, group, file.path, width, function (w) {
              screenshotSizesDone.push(w);
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
    });

    if (!fileExists.check(pagePath)) {
      screenshotSizes.forEach(function (size) {
        markbotMain.send('check-group:item-new', group, listenerId(size), listenerLabel(size));
        markbotMain.send('check-group:item-complete', group, listenerId(size), listenerLabel(size), ['The file is missing or misspelled']);
        next();
      });
      return;
    } else {
      screenshotSizes.forEach(function (size) {
        markbotMain.send('check-group:item-new', group, listenerId(size), listenerLabel(size));
      });
    }

    webLoader.load(file.path, {width: MAX_WINDOW_WIDTH, height: MAX_WINDOW_HEIGHT}, function (theWindow) {
      theWindow.webContents.insertCSS(defaultScreenshotCSS);
      theWindow.webContents.executeJavaScript(getResizeInjectionJs(theWindow.id, taskRunnerId, ipcListenerResizeChannel), function (windowId) {
        nextScreenshot(windowId);
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
