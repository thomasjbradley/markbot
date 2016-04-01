'use strict';

const
  fs = require('fs'),
  path = require('path'),
  util = require('util'),
  ipcMain = require('electron').ipcMain,
  electron = require('electron'),
  app = electron.app,
  BrowserWindow = require('electron').BrowserWindow,
  fileExists = require('../file-exists'),
  classify = require('../classify'),
  injectionJs = fs.readFileSync(path.resolve(__dirname + '/functionality/injection.js'), 'utf8')
  ;

const makeExecTestJs = function (js, testIndex, label) {
  return `
    (function () {
      ${injectionJs}

      __MarkbotInjectedFunctions.passLabel = '__markbot-functionality-test-pass-${label}';
      __MarkbotInjectedFunctions.failLabel = '__markbot-functionality-test-fail-${label}';
      __MarkbotInjectedFunctions.debugLabel = '__markbot-functionality-test-debug-${label}';

      (function ($, $$, css, on, ev, pass, fail, debug) {
        'use strict';

        try {
          eval(${js});
        } catch (e) {
          if (e.message) debug('Functionality testing error, test #${testIndex} —', e.message);
          fail('Double check the Javascript');
        }
      }(
        __MarkbotInjectedFunctions.$,
        __MarkbotInjectedFunctions.$$,
        __MarkbotInjectedFunctions.css,
        __MarkbotInjectedFunctions.on,
        __MarkbotInjectedFunctions.ev,
        __MarkbotInjectedFunctions.pass,
        __MarkbotInjectedFunctions.fail,
        __MarkbotInjectedFunctions.debug
      ));
    }());
  `;
};

const runTest = function (win, testJs, testIndex, listenerLabel) {
  win.webContents.executeJavaScript(makeExecTestJs(JSON.stringify(testJs.trim()), testIndex, listenerLabel));
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
      webPreferences: {
        nodeIntegration: true,
        preload: path.resolve(__dirname + '/hidden-browser-window-preload.js')
      },
      defaultEncoding: 'UTF-8'
    }),
    didFinishLoad = false,
    domReady = false,
    onFinishLoadFired = false,
    onFinishLoad,
    listenerLabel = classify(`${file.path}-${Date.now()}`),
    currentTestIndex = 1
    ;

  listener.send('check-group:item-new', group, file.path, file.path);

  if (!fileExists.check(pagePath)) {
    listener.send('check-group:item-complete', group, file.path, file.path, [`The file “${file.path}” is missing or misspelled`]);
    return;
  }

  listener.send('check-group:item-computing', group, file.path, file.path);

  ipcMain.on('__markbot-functionality-test-pass-' + listenerLabel, function(event) {
    if (file.tests.length > 0) {
      currentTestIndex++
      runTest(win, file.tests.shift(), currentTestIndex, listenerLabel);
    } else {
      win.destroy();
      win = null;
      ipcMain.removeAllListeners('__markbot-functionality-test-pass-' + listenerLabel);
      ipcMain.removeAllListeners('__markbot-functionality-test-fail-' + listenerLabel);
      ipcMain.removeAllListeners('__markbot-functionality-test-debug-' + listenerLabel);
      listener.send('check-group:item-complete', group, file.path, file.path);
    }
  });

  ipcMain.on('__markbot-functionality-test-fail-' + listenerLabel, function(event, reason) {
    win.destroy();
    win = null;
    ipcMain.removeAllListeners('__markbot-functionality-test-pass-' + listenerLabel);
    ipcMain.removeAllListeners('__markbot-functionality-test-fail-' + listenerLabel);
    ipcMain.removeAllListeners('__markbot-functionality-test-debug-' + listenerLabel);
    listener.send('check-group:item-complete', group, file.path, file.path, [`The website isn’t functioning as expected: ${reason}`]);
  });

  ipcMain.on('__markbot-functionality-test-debug-' + listenerLabel, function (event, ...e) {
    listener.send('debug', ...e);
  });

  win.loadURL(pageUrl, {'extraHeaders': 'pragma: no-cache\n'});

  onFinishLoad = function () {
    // Artificial delay for final rendering bits, sometimes a little slower than domReady & didFinishLoad
    setTimeout(function () {
      runTest(win, file.tests.shift(), currentTestIndex, listenerLabel);
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
