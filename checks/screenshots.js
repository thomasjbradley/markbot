'use strict';

var
  fs = require('fs'),
  path = require('path'),
  util = require('util'),
  fork = require('child_process').fork,
  mkdirp = require('mkdirp'),
  app = require('electron').app,
  BrowserWindow = require('electron').BrowserWindow,
  jimp = require('jimp'),
  fileExists = require('./file-exists'),
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
    jimp.read(img.buffer, function (err, image) {
      image
        .resize(width, jimp.AUTO)
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
    let
      width = sizes.shift(),
      js = `window.resizeTo(${width}, (document.documentElement.offsetHeight > ${defaultHeight}) ? document.documentElement.offsetHeight : ${defaultHeight})`
      ;

    win.webContents.executeJavaScript(js);

    // Artificial delay to wait for the resized browser to re-render
    setTimeout(function () {
      win.capturePage(function (img) {
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

module.exports.check = function (listener, fullPath, file, group, genRefScreens) {
  let
    pagePath = path.resolve(fullPath + '/' + file.path),
    pageUrl = 'file:///' + pagePath,
    win = new BrowserWindow({
      width: file.sizes[0],
      height: defaultHeight,
      show: false,
      frame: false,
      enableLargerThanScreen: true,
      backgroundColor: '#fff',
      nodeIntegration: false,
      defaultEncoding: 'UTF-8'
    }),
    refScreenPath = (genRefScreens) ? path.resolve(fullPath) : false,
    differs = {}
    ;

  file.sizes.forEach(function (size) {
    differs[size] = fork(`${__dirname}/screenshots/differ`, {
      cwd: path.resolve(__dirname, '../node_modules'),
      env: {
        NODE_PATH: path.resolve(__dirname, '../node_modules')
      }
    });

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
                differs[size].send({
                  type: 'check',
                  paths: bothScreens[size]
                });
              });
            }
          });
        }, 200);

      }
    }, 100);
  });
};
