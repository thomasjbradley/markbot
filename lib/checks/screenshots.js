'use strict';

const MIN_WINDOW_HEIGHT = 400;
const MAX_WINDOW_HEIGHT = 6000;
const MAX_WINDOW_WIDTH = 3000;
const SCREENSHOT_PREFIX = 'markbot';
const REFERENCE_SCREENSHOT_FOLDER = 'screenshots';

const fs = require('fs');
const path = require('path');
const util = require('util');
const fork = require('child_process').fork;
const electron = require('electron');
const ipcMain = require('electron').ipcMain;
const app = electron.app;
const jimp = require('jimp');
const fileExists = require('../file-exists');
const webLoader = require('../web-loader');
const defaultScreenshotCSS = fs.readFileSync(path.resolve(__dirname + '/screenshots/default.css'), 'utf8');
const defaultScreenshotJS = fs.readFileSync(path.resolve(__dirname + '/screenshots/default.js'), 'utf8');
const classify = require('../classify');

const getResizeInjectionJs = function (ipcListenerChannel) {
  return `
    (function (listenerLabel) {
      'use strict';

      ${defaultScreenshotJS}

    }('${ipcListenerChannel}'));
  `;
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
  const ipcListenerLabel = classify(`${file.path}-${Date.now()}`);
  const ipcListenerResizeChannel = `__markbot-screenshots-resized-${ipcListenerLabel}`;
  const listenerId = function (size) { return `${file.path}-${size}`; };
  const listenerLabel = function (size) { return `${file.path} — ${size}px`; };
  let screenshotSizes = file.sizes.slice();
  let win;

  const nextScreenshot = function () {
    let nextSize = screenshotSizes.shift();
    listener.send('check-group:item-computing', group, listenerId(nextSize), listenerLabel(nextSize));
    resizeWindowToWidth(win, nextSize);
  };

  const cleanup = function () {
    webLoader.destroy(win);
    ipcMain.removeAllListeners(ipcListenerResizeChannel);
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

  webLoader.load(file.path, {width: MAX_WINDOW_WIDTH, height: MAX_WINDOW_HEIGHT}, function (theWindow) {
    win = theWindow;

    win.webContents.insertCSS(defaultScreenshotCSS);
    win.webContents.executeJavaScript(getResizeInjectionJs(ipcListenerResizeChannel), function () {
      nextScreenshot();
    });
  });
};

module.exports = {
  REFERENCE_SCREENSHOT_FOLDER: REFERENCE_SCREENSHOT_FOLDER,
  getScreenshotFileName: formatScreenshotFileName,
  getScreenshotPath: getImagePath,
  check: check,
};
