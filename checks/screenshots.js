'use strict';

var
  fs = require('fs'),
  path = require('path'),
  util = require('util'),
  mkdirp = require('mkdirp'),
  app = require('electron').app,
  BrowserWindow = require('electron').BrowserWindow,
  fileExists = require('./file-exists'),
  differ = require('./screenshots/differ'),
  defaultScreenshotCSS = fs.readFileSync(path.resolve(__dirname + '/screenshots/default.css'), 'utf8'),
  screenshotPrefix = 'markbot',
  defaultHeight = 400,
  refScreenFolder = 'screenshots'
;

const getScreenshotFileName = function (filePath, width, prefix) {
  let pre = (prefix) ? prefix + '-' : '';

  return util.format('%s%s-%d.png',
    pre,
    filePath
      .trim()
      .toLowerCase()
      .replace(/\.html$/, '')
      .replace(/[^a-z0-9\-]/g, '-')
      .replace(/\-+/g, '-'),
    width
  );
};

const saveScreenshot = function (filePath, width, img, refScreenPath) {
  var filename, imgPath, fullPath;

  if (refScreenPath) {
    filename = getScreenshotFileName(filePath, width);
    imgPath = path.resolve(refScreenPath + '/' + refScreenFolder);
    mkdirp.sync(imgPath);
    fullPath = path.resolve(imgPath + '/' + filename);
  } else {
    filename = getScreenshotFileName(filePath, width, screenshotPrefix);
    fullPath = path.resolve(app.getPath('temp') + '/' + filename);
  }

  fs.writeFileSync(fullPath, img.toPng());

  return fullPath;
}

const takeScreenshotAtWidth = function (win, filePath, sizes, refScreenPath, savedPaths, cb) {
  if (sizes.length > 0) {
    let width = sizes.shift();

    win.setSize(width, defaultHeight);
    win.webContents.executeJavaScript(util.format(
      'window.resizeTo(%d, (document.documentElement.offsetHeight > %d) ? document.documentElement.offsetHeight : %d)',
      width,
      defaultHeight,
      defaultHeight
    ));

    // Artificial delay to wait for the resized browser to re-render
    setTimeout(function () {
      win.capturePage(function (img) {
        savedPaths.push(saveScreenshot(filePath, width, img, refScreenPath));
        takeScreenshotAtWidth(win, filePath, sizes, refScreenPath, savedPaths, cb);
      });
    }, 300);
  } else {
    if (cb) cb(savedPaths);
  }
};

const takeScreenshots = function (win, file, refScreenPath, cb) {
  takeScreenshotAtWidth(win, file.path, file.sizes.slice(0), refScreenPath, [], function (paths) {
    cb(paths);
  });
};

const findMatchingScreenshots = function (screenshotPaths, refScreenPath) {
  let bothScreens = {};

  screenshotPaths.forEach(function (file) {
    let
      filename,
      filenameMatches = file.match(new RegExp(util.format('%s-(.+)\.png$', screenshotPrefix))),
      imgPath = path.resolve(refScreenPath + '/' + refScreenFolder)
      ;

    if(filenameMatches[1]) {
      let refImg = path.resolve(imgPath + '/' + filenameMatches[1] + '.png');

      if (fileExists.check(refImg)) {
        bothScreens[filenameMatches[1].match(/(\d+)$/)[1]] = {
          new: file,
          ref: refImg
        };
      } else {
        bothScreens[filenameMatches[1].match(/(\d+)$/)[1]] = {
          new: file,
          ref: false
        };
      }
    }
  });

  return bothScreens;
};

module.exports.check = function (listener, fullPath, file, group, genRefScreens) {
  let
    pagePath = path.resolve(fullPath + '/' + file.path),
    pageUrl = 'file:///' + pagePath,
    win = new BrowserWindow({
      width: file.sizes[0],
      height: defaultHeight,
      show: false,
      frame: false,
      backgroundColor: '#fff',
      nodeIntegration: false,
      defaultEncoding: 'UTF-8'
    }),
    refScreenPath = (genRefScreens) ? path.resolve(fullPath) : false,
    differs = {}
    ;

  file.sizes.forEach(function (size) {
    differs[size] = differ.init(listener, group, file.path, size);
  });

  if (!fileExists.check(pagePath)) {
    file.sizes.forEach(function (size) {
      differs[size].missing();
    });
    return;
  }

  win.loadURL(pageUrl);

  win.webContents.on('did-finish-load', function () {
    win.webContents.insertCSS(defaultScreenshotCSS);

    var loadingTimer = setInterval(function () {
      if (!win.webContents.isLoading()) {
        clearInterval(loadingTimer);

        // Artificial delay for final rendering bits, sometimes a little slower than isLoading() call
        setTimeout(function () {
          takeScreenshots(win, file, refScreenPath, function (screenshotPaths) {
            win.destroy();
            win = null;

            if (!genRefScreens) {
              let bothScreens = findMatchingScreenshots(screenshotPaths, path.resolve(fullPath));

              file.sizes.forEach(function (size) {
                differs[size].check(bothScreens[size]);
              });
            }
          });
        }, 200);

      }
    }, 100);
  });
};
