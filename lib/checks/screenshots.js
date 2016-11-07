'use strict';

const
  MIN_WINDOW_HEIGHT = 400,
  MAX_WINDOW_HEIGHT = 6000,
  MAX_WINDOW_WIDTH = 3000,
  SCREENSHOT_PREFIX = 'markbot',
  REFERENCE_SCREENSHOT_FOLDER = 'screenshots'
  ;

const
  fs = require('fs'),
  path = require('path'),
  util = require('util'),
  fork = require('child_process').fork,
  electron = require('electron'),
  ipcMain = require('electron').ipcMain,
  app = electron.app,
  BrowserWindow = require('electron').BrowserWindow,
  jimp = require('jimp'),
  fileExists = require('../file-exists'),
  defaultScreenshotCSS = fs.readFileSync(path.resolve(__dirname + '/screenshots/default.css'), 'utf8'),
  defaultScreenshotJS = fs.readFileSync(path.resolve(__dirname + '/screenshots/default.js'), 'utf8'),
  classify = require('../classify')
  ;

const getResizeInjectionJs = function (ipcListenerChannel) {
  return `
    (function (listenerLabel) {
      'use strict';

      ${defaultScreenshotJS}

    }('${ipcListenerChannel}'));
  `;
};

const getNewBrowserWindow = function () {
  return new BrowserWindow({
    x: 0,
    y: 0,
    center: false,
    width: MAX_WINDOW_WIDTH,
    height: MAX_WINDOW_HEIGHT,
    show: false,
    frame: false,
    enableLargerThanScreen: true,
    backgroundColor: '#fff',
    webPreferences: {
      nodeIntegration: true,
      preload: path.resolve(__dirname + '/hidden-browser-window-preload.js')
    },
    defaultEncoding: 'UTF-8'
  });
};

const formatScreenshotFileName = function (filename, width, prefix) {
  let pre = (prefix) ? `${prefix}-` : '';

  return util.format('%s%s-%d.png', pre, classify(filename.replace(/\.html$/, '')), width);
};

const getImagePath = function (projectPath, filename, width, genRefScreens) {
  let formattedFilename, imgPath, fullPath;

  if (genRefScreens) {
    formattedFilename = formatScreenshotFileName(filename, width);
    imgPath = path.resolve(path.resolve(projectPath) + '/' + REFERENCE_SCREENSHOT_FOLDER);
    fullPath = path.resolve(imgPath + '/' + formattedFilename);
  } else {
    formattedFilename = formatScreenshotFileName(filename, width, SCREENSHOT_PREFIX);
    fullPath = path.resolve(app.getPath('temp') + '/' + formattedFilename);
  }

  return fullPath;
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

const takeScreenshotAtSize = function (win, width, height, next) {
  win.capturePage({x: 0, y:0, width: width, height: getCropHeight(height)}, next);
};

const resizeWindowToWidth = function (win, width) {
  win.setSize(width, MAX_WINDOW_HEIGHT);
};

const diffScreenshot = function (listener, fullPath, group, filename, width) {
  let differ = fork(`${__dirname}/screenshots/differ`);

  differ.on('message', function (message) {
    switch (message.type) {
      case 'kill':
        differ.kill();
        differ = null;
        break;
      case 'debug':
        listener.send('debug', message.debug.join(' '));
        break;
      default:
        if (message.messages) {
          listener.send(message.id, group, message.checkId, message.checkLabel, [], '', message.messages);
        } else {
          listener.send(message.id, group, message.checkId, message.checkLabel, message.errors);
        }
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
      new: getImagePath(fullPath, filename, width, false),
      ref: getImagePath(fullPath, filename, width, true)
    }
  });
};

const check = function (listener, fullPath, file, group) {
  const pagePath = path.resolve(fullPath + '/' + file.path);
  const pageUrl = 'file:///' + pagePath;
  const ipcListenerLabel = classify(`${file.path}-${Date.now()}`);
  const ipcListenerResizeChannel = `__markbot-screenshots-resized-${ipcListenerLabel}`;
  const listenerId = function (size) { return `${file.path}-${size}`; };
  const listenerLabel = function (size) { return `${file.path} — ${size}px`; };
  let screenshotSizes = file.sizes.slice();
  let win = getNewBrowserWindow();
  let didFinishLoad = false;
  let domReady = false;
  let windowLoaded = false;
  let fontsReady = false;
  let onFinishLoadFired = false;

  const onFinishLoad = function () {
    win.webContents.insertCSS(defaultScreenshotCSS);
    win.webContents.executeJavaScript(getResizeInjectionJs(ipcListenerResizeChannel), function () {
      nextScreenshot();
    });
  };

  const nextScreenshot = function () {
    let nextSize = screenshotSizes.shift();
    listener.send('check-group:item-computing', group, listenerId(nextSize), listenerLabel(nextSize));
    resizeWindowToWidth(win, nextSize);
  };

  const cleanup = function () {
    win.destroy();
    win = null;
    ipcMain.removeAllListeners(ipcListenerResizeChannel);
    ipcMain.removeAllListeners('__markbot-hidden-browser-window-loaded');
    ipcMain.removeAllListeners('__markbot-hidden-browser-window-fonts-loaded');
  };

  ipcMain.on(ipcListenerResizeChannel, function (event, width, height) {
    takeScreenshotAtSize(win, width, height, function (img) {
      let imagePath = getImagePath(fullPath, file.path, width);

      saveScreenshot(imagePath, width, img, function () {
        if (fileExists.check(getImagePath(fullPath, file.path, width, true))) {
          diffScreenshot(listener, fullPath, group, file.path, width);
        } else {
          listener.send('check-group:item-complete', group, listenerId(width), listenerLabel(width), [`Reference screenshot not found in the “${REFERENCE_SCREENSHOT_FOLDER}” folder`]);
        }

        if (screenshotSizes.length > 0) {
          nextScreenshot();
        } else {
          cleanup();
        }
      });
    });
  });

  const waitForFinalLoad = function () {
    // The `did-finish-load` & `dom-ready` events often fire too soon to execute JS in the window
    const isLoading = setInterval(function () {
      if (!win.webContents.isLoading()) {
        clearInterval(isLoading);
        onFinishLoad();
      }
    }, 20);
  };

  const checkForFinalLoad = function () {
    if (didFinishLoad && domReady && windowLoaded && fontsReady && !onFinishLoadFired) {
      onFinishLoadFired = true;
      waitForFinalLoad();
    }
  };

  win.webContents.on('did-finish-load', function () {
    didFinishLoad = true;
    checkForFinalLoad();
  });

  win.webContents.on('dom-ready', function () {
    domReady = true;
    checkForFinalLoad();
  });

  ipcMain.on('__markbot-hidden-browser-window-fonts-loaded', function (event, details) {
    fontsReady = true;
    checkForFinalLoad();
  });

  ipcMain.on('__markbot-hidden-browser-window-loaded', function (event, details) {
    windowLoaded = true;
    checkForFinalLoad();
  });

  if (!fileExists.check(pagePath)) {
    screenshotSizes.forEach(function (size) {
      listener.send('check-group:item-new', group, listenerId(size), listenerLabel(size));
      listener.send('check-group:item-complete', group, listenerId(size), listenerLabel(size), ['The file is missing or misspelled']);
    });
    return;
  } else {
    screenshotSizes.forEach(function (size) {
      listener.send('check-group:item-new', group, listenerId(size), listenerLabel(size));
    });
  }

  win.loadURL(pageUrl, {'extraHeaders': 'pragma: no-cache\n'});
};

module.exports = {
  REFERENCE_SCREENSHOT_FOLDER: REFERENCE_SCREENSHOT_FOLDER,
  getScreenshotFileName: formatScreenshotFileName,
  getScreenshotPath: getImagePath,
  check: check
}
