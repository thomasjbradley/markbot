'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const ipcMain = require('electron').ipcMain;
const electron = require('electron');
const app = electron.app;
const BrowserWindow = require('electron').BrowserWindow;
const fileExists = require('../file-exists');
const classify = require('../classify');
const injectionJs = fs.readFileSync(path.resolve(__dirname + '/functionality/injection.js'), 'utf8');

const getNewBrowserWindow = function () {
  return new BrowserWindow({
      x: 0,
      y: 0,
      center: false,
      width: 1000,
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
    })
};

const makeExecTestJs = function (js, testIndex, label, winId) {
  return `
    (function () {
      ${injectionJs}

      __MarkbotInjectedFunctions.browserWindowID = ${winId};
      __MarkbotInjectedFunctions.passLabel = '__markbot-functionality-test-pass-${label}';
      __MarkbotInjectedFunctions.failLabel = '__markbot-functionality-test-fail-${label}';
      __MarkbotInjectedFunctions.debugLabel = '__markbot-functionality-test-debug-${label}';

      (function ($, $$, css, on, ev, send, hover, pass, fail, debug) {
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
        __MarkbotInjectedFunctions.send,
        __MarkbotInjectedFunctions.hover,
        __MarkbotInjectedFunctions.pass,
        __MarkbotInjectedFunctions.fail,
        __MarkbotInjectedFunctions.debug
      ));
    }());
  `;
};

const runTest = function (win, testJs, testIndex, listenerLabel) {
  let js = makeExecTestJs(JSON.stringify(testJs.trim()), testIndex, listenerLabel, win.id);

  win.webContents.executeJavaScript(js);
};

const check = function (listener, fullPath, file, group) {
  const pagePath = path.resolve(fullPath + '/' + file.path);
  const pageUrl = 'file:///' + pagePath;
  const listenerLabel = classify(`${file.path}-${Date.now()}`);
  let win = getNewBrowserWindow();
  let didFinishLoad = false;
  let domReady = false;
  let onFinishLoadFired = false;
  let currentTestIndex = 1;

  const onFinishLoad = function () {
    if (file.tests) runTest(win, file.tests.shift(), currentTestIndex, listenerLabel);
    if (file.noErrors) listener.send('check-group:item-complete', group, file.path, file.path);
  };

  const waitForFinalLoad = function () {
    // The `did-finish-load` & `dom-ready` events often fire too soon to execute JS in the window
    const isLoading = setInterval(function () {
      if (!win.webContents.isLoading()) {
        clearInterval(isLoading);
        onFinishLoad();
      }
    }, 20);
  };

  const cleanup = function () {
    win.destroy();
    win = null;
    ipcMain.removeAllListeners('__markbot-functionality-error');
    ipcMain.removeAllListeners('__markbot-functionality-test-pass-' + listenerLabel);
    ipcMain.removeAllListeners('__markbot-functionality-test-fail-' + listenerLabel);
    ipcMain.removeAllListeners('__markbot-functionality-test-debug-' + listenerLabel);
  };

  listener.send('check-group:item-new', group, file.path, file.path);

  if (!fileExists.check(pagePath)) {
    listener.send('check-group:item-complete', group, file.path, file.path, [`The file \`${file.path}\` is missing or misspelled`]);
    return;
  }

  listener.send('check-group:item-computing', group, file.path, file.path);

  ipcMain.on('__markbot-functionality-error', function (event, message, line, filename) {
    filename = filename.replace(fullPath, '').replace('file:///', '');
    cleanup();
    listener.send('check-group:item-complete', group, file.path, file.path, [`${message} — \`${filename}\` on line ${line}`]);
  });

  ipcMain.on('__markbot-functionality-test-pass-' + listenerLabel, function(event) {
    if (file.tests.length > 0) {
      currentTestIndex++
      runTest(win, file.tests.shift(), currentTestIndex, listenerLabel);
    } else {
      cleanup();
      listener.send('check-group:item-complete', group, file.path, file.path);
    }
  });

  ipcMain.on('__markbot-functionality-test-fail-' + listenerLabel, function(event, reason) {
    cleanup();
    listener.send('check-group:item-complete', group, file.path, file.path, [`The website isn’t functioning as expected: ${reason}`]);
  });

  ipcMain.on('__markbot-functionality-test-debug-' + listenerLabel, function (event, ...e) {
    listener.send('debug', ...e);
  });

  win.webContents.on('did-finish-load', function () {
    didFinishLoad = true;

    if (didFinishLoad && domReady && !onFinishLoadFired) {
      onFinishLoadFired = true;
      waitForFinalLoad();
    }
  });

  win.webContents.on('dom-ready', function () {
    domReady = true;

    if (didFinishLoad && domReady && !onFinishLoadFired) {
      onFinishLoadFired = true;
      waitForFinalLoad();
    }
  });

  win.loadURL(pageUrl, {'extraHeaders': 'pragma: no-cache\n'});
};

module.exports = {
  check: check
}
