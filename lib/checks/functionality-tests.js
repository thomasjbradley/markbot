'use strict';

var
  fs = require('fs'),
  path = require('path'),
  util = require('util'),
  electron = require('electron'),
  app = electron.app,
  BrowserWindow = require('electron').BrowserWindow,
  fileExists = require('../file-exists'),
  injectionJs = ''
;

const makeExecTestJs = function (js) {
  return `(function () {
    'use strict';

    ${injectionJs}

    try {
      ${js}
    } catch (e) {
      return 'Double check the Javascript';
    }
  }());`;
};

const runTest = function (win, listener, group, label, allTests) {
  win.webContents.executeJavaScript(makeExecTestJs(allTests.shift()), function (result) {
    if (result === true) {
      if (allTests.length > 0) {
        runTest(win, listener, group, label, allTests);
      } else {
        win.destroy();
        win = null;
        listener.send('check-group:item-complete', group, label, label);
      }
    } else {
      win.destroy();
      win = null;
      listener.send('check-group:item-complete', group, label, label, [`The website isn’t functioning as expected: ${result}`]);
    }
  });
};

const check = function (listener, fullPath, file, group) {
  let
    pagePath = path.resolve(fullPath + '/' + file.path),
    pageUrl = 'file:///' + pagePath,
    win = new BrowserWindow({
      x: 0,
      y: 0,
      center: false,
      width: 800,
      height: 600,
      show: false,
      frame: false,
      enableLargerThanScreen: true,
      backgroundColor: '#fff',
      nodeIntegration: false,
      defaultEncoding: 'UTF-8'
    }),
    didFinishLoad = false,
    domReady = false,
    onFinishLoadFired = false,
    onFinishLoad
    ;

  listener.send('check-group:item-new', group, file.path, file.path);

  if (!fileExists.check(pagePath)) {
    listener.send('check-group:item-complete', group, file.path, file.path, [`The file “${file.path}” is missing or misspelled`]);
    return;
  }

  listener.send('check-group:item-computing', group, file.path, file.path);
  if (!injectionJs) injectionJs = fs.readFileSync(path.resolve(__dirname + '/functionality/injection.js'));

  win.loadURL(pageUrl, {'extraHeaders': 'pragma: no-cache\n'});

  onFinishLoad = function () {
    // Artificial delay for final rendering bits, sometimes a little slower than domReady & didFinishLoad
    setTimeout(function () {
      runTest(win, listener, group, file.path, file.tests);
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
  check: check
}
