'use strict';

var
  fs = require('fs'),
  path = require('path'),
  util = require('util'),
  fork = require('child_process').fork,
  mkdirp = require('mkdirp'),
  electron = require('electron'),
  app = electron.app,
  BrowserWindow = require('electron').BrowserWindow,
  jimp = require('jimp'),
  fileExists = require('../lib/file-exists'),
  defaultScreenshotCSS = fs.readFileSync(path.resolve(__dirname + '/screenshots/default.css'), 'utf8'),
  defaultScreenshotJS = require('./screenshots/default'),
  screenshotPrefix = 'markbot',
  minWindowHeight = 400,
  maxWindowHeight = 6000,
  refScreenFolder = 'screenshots'
;

const getCropHeight = function (height) {
  if (height > maxWindowHeight) return maxWindowHeight;
  if (height < minWindowHeight) return minWindowHeight;
  return height;
};

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

const saveScreenshot = function (filePath, width, img, refScreenPath, cb) {
  var
    filename,
    imgPath,
    fullPath,
    imgBuffer,
    imgSize = img.getSize()
    ;

  if (refScreenPath) {
    filename = getScreenshotFileName(filePath, width);
    imgPath = path.resolve(refScreenPath + '/' + refScreenFolder);
    mkdirp.sync(imgPath);
    fullPath = path.resolve(imgPath + '/' + filename);
  } else {
    filename = getScreenshotFileName(filePath, width, screenshotPrefix);
    fullPath = path.resolve(app.getPath('temp') + '/' + filename);
  }

  if (imgSize.width > width) {
    // Handle screenshots taken on retina displays
    jimp.read(img.toPng(), function (err, image) {
      image
        .resize(width, jimp.AUTO)
        .rgba(false)
        .write(fullPath, function () {
          cb(fullPath);
        })
        ;
    });
  } else {
    fs.writeFile(fullPath, img.toPng(), function () {
      cb(fullPath);
    });
  }
}

const takeScreenshotAtWidth = function (win, filePath, sizes, refScreenPath, savedPaths, cb) {
  if (sizes.length > 0) {
    let width = sizes.shift();

    win.setSize(width, maxWindowHeight);
    win.webContents.executeJavaScript(defaultScreenshotJS);

    // Artificial delay to wait for the resized browser to re-render
    setTimeout(function () {
      // Using the <title> to pass information back and forth is super hacky
      // But the async ways were causing way too many problems
      let height = getCropHeight(parseInt(win.webContents.getTitle(), 10) || minWindowHeight);

      win.capturePage({x: 0, y:0, width: width, height: height}, function (img) {
        saveScreenshot(filePath, width, img, refScreenPath, function (path) {
          savedPaths.push(path);
          takeScreenshotAtWidth(win, filePath, sizes, refScreenPath, savedPaths, cb);
        });
      });
    }, 600);
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

const check = function (listener, fullPath, file, group, genRefScreens) {
  let
    pagePath = path.resolve(fullPath + '/' + file.path),
    pageUrl = 'file:///' + pagePath,
    win = new BrowserWindow({
      x: 0,
      y: 0,
      center: false,
      width: file.sizes[0],
      height: minWindowHeight,
      show: false,
      frame: false,
      enableLargerThanScreen: true,
      backgroundColor: '#fff',
      nodeIntegration: false,
      defaultEncoding: 'UTF-8'
    }),
    refScreenPath = (genRefScreens) ? path.resolve(fullPath) : false,
    differs = {},
    didFinishLoad = false,
    domReady = false,
    onFinishLoadFired = false,
    onFinishLoad
    ;

  file.sizes.forEach(function (size) {
    // This was moved here from `differ.js` because the screenshot checks were starting too slowly
    //   students were able to click the Submit to Canvas button if all other checks finished before
    //   the screenshots started
    listener.send('check-group:item-new', group, file.path + '-' + size, file.path + ' — ' + size + 'px');
  });

  file.sizes.forEach(function (size) {
    differs[size] = fork(`${__dirname}/screenshots/differ`);

    differs[size].send({
      type: 'init',
      filePath: file.path,
      size: size
    });

    differs[size].on('message', function (message) {
      switch (message.type) {
        case 'kill':
          differs[size].kill();
          delete differs[size];
          break;
        case 'debug':
          listener.send('debug', message.debug.join(' '));
          break;
        default:
          listener.send(message.id, group, message.checkId, message.checkLabel, message.errors);
          break;
      }
    });
  });

  if (!fileExists.check(pagePath)) {
    file.sizes.forEach(function (size) {
      differs[size].send({type: 'missing'});
    });
    return;
  }

  win.loadURL(pageUrl, {'extraHeaders': 'pragma: no-cache\n'});

  onFinishLoad = function () {
    win.webContents.insertCSS(defaultScreenshotCSS);

    // Artificial delay for final rendering bits, sometimes a little slower than domReady & didFinishLoad
    setTimeout(function () {
      takeScreenshots(win, file, refScreenPath, function (screenshotPaths) {
        win.destroy();
        win = null;

        if (!genRefScreens) {
          let bothScreens = findMatchingScreenshots(screenshotPaths, path.resolve(fullPath));

          file.sizes.forEach(function (size) {
            differs[size].send({
              type: 'check',
              paths: bothScreens[size]
            });
          });
        }
      });
    }, 200);
  };

  win.webContents.on('did-finish-load', function () {
    didFinishLoad = true;

    if (didFinishLoad && domReady && !onFinishLoadFired) {
      onFinishLoadFired = true;
      onFinishLoad();
    }
  });

  win.webContents.on('dom-ready', function () {
    domReady = true;

    if (didFinishLoad && domReady && !onFinishLoadFired) {
      onFinishLoadFired = true;
      onFinishLoad();
    }
  });
};

module.exports = {
  REFERENCE_SCREENSHOT_FOLDER: refScreenFolder,
  getScreenshotFileName: getScreenshotFileName,
  check: check
}
