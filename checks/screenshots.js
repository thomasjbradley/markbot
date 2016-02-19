'use strict';

var
  fs = require('fs'),
  path = require('path'),
  util = require('util'),
  mkdirp = require('mkdirp'),
  BrowserWindow = require('electron').BrowserWindow,
  defaultHeight = 400
;

const getScreenshotFileName = function (filePath, width, prefix) {
  let pre = (prefix) ? prefix + '-' : '';

  return util.format('%s%s-%d.png', pre, filePath.trim().replace(/\.html$/, ''), width);
};

const saveScreenshot = function (filePath, width, img, refScreenPath) {
  var filename, imgPath;

  if (refScreenPath) {
    filename = getScreenshotFileName(filePath, width);
    imgPath = path.resolve(refScreenPath + '/screenshots');
    mkdirp.sync(imgPath);
    fs.writeFileSync(path.resolve(imgPath + '/' + filename), img.toPng());
  } else {
    filename = getScreenshotFileName(filePath, width, 'markbot');
  }
}

const takeScreenshots = function (win, file, refScreenPath, cb) {
  let
    totalSizes = file.sizes.length,
    amountCompleted = 0,
    completionTimer
    ;

  file.sizes.forEach(function (width, i) {
    if (i !== 0) win.setSize(width, defaultHeight);

    win.capturePage({x: 0, y: 0, width: width, height: win.getContentSize()[1]}, function (img) {
      saveScreenshot(file.path, width, img, refScreenPath);
      amountCompleted++;
    });
  });

  completionTimer = setInterval(function () {
    if (amountCompleted >= totalSizes) {
      clearInterval(completionTimer);
      cb();
    }
  }, 50);
};

module.exports.check = function (listener, fullPath, file, group, genRefScreens) {
  let
    pageUrl = 'file:///' + path.resolve(fullPath + '/' + file.path),
    win = new BrowserWindow({
      width: file.sizes[0],
      height: defaultHeight,
      show: false,
      frame: false,
      backgorundColor: '#fff',
      nodeIntegration: false,
      defaultEncoding: 'UTF-8'
    }),
    refScreenPath = (genRefScreens) ? path.resolve(fullPath) : false
    ;

  win.loadURL(pageUrl);

  win.webContents.on('did-finish-load', function () {
    var loadingTimer = setInterval(function () {
      if (!win.webContents.isLoading()) {
        clearInterval(loadingTimer);
        takeScreenshots(win, file, refScreenPath, function () {
          win.destroy();
          win = null;

          if (!genRefScreens) {
            // diffScreens
          }
        });
      }
    }, 100);
  });
};
