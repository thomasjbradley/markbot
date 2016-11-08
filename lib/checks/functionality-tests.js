'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const ipcMain = require('electron').ipcMain;
const fileExists = require('../file-exists');
const classify = require('../classify');
const webLoader = require('../web-loader');
const injectionJs = fs.readFileSync(path.resolve(__dirname + '/functionality/injection.js'), 'utf8');

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
  let currentTestIndex = 1;
  let win;

  const cleanup = function () {
    webLoader.destroy(win);

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

  webLoader.load(pageUrl, {}, function (theWindow) {
    win = theWindow;

    if (file.tests) runTest(win, file.tests.shift(), currentTestIndex, listenerLabel);
    if (file.noErrors) listener.send('check-group:item-complete', group, file.path, file.path);
  });
};

module.exports = {
  check: check,
};
