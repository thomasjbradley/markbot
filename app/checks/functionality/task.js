(function () {
  'use strict';

  const fs = require('fs');
  const path = require('path');
  const util = require('util');
  const ipcMain = require('electron').remote.ipcMain;
  const fileExists = require('./file-exists');
  const classify = require('./classify');
  const webLoader = require('./web-loader');
  const injectionJs = fs.readFileSync(path.resolve(__dirname + '/checks/functionality/injection.js'), 'utf8');
  const markbotMain = require('electron').remote.require('./app/markbot-main');

  const group = taskDetails.group;
  const fullPath = taskDetails.cwd;

  let totalFiles = 0;

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

  const check = function (file, next) {
    const pagePath = path.resolve(fullPath + '/' + file.path);
    const listenerLabel = classify(`${file.path}-${Date.now()}`);
    let currentTestIndex = 1;
    let win;

    const cleanup = function () {
      ipcMain.removeAllListeners('__markbot-functionality-error');
      ipcMain.removeAllListeners('__markbot-functionality-test-pass-' + listenerLabel);
      ipcMain.removeAllListeners('__markbot-functionality-test-fail-' + listenerLabel);
      ipcMain.removeAllListeners('__markbot-functionality-test-debug-' + listenerLabel);

      webLoader.destroy(win);
      win = null;
    };

    markbotMain.send('check-group:item-new', group, file.path, file.path);

    if (!fileExists.check(pagePath)) {
      markbotMain.send('check-group:item-complete', group, file.path, file.path, [`The file \`${file.path}\` is missing or misspelled`]);
      return next();
    }

    markbotMain.send('check-group:item-computing', group, file.path, file.path);

    ipcMain.on('__markbot-functionality-error', function (event, message, line, filename) {
      filename = filename.replace(fullPath, '').replace('file:///', '');
      cleanup();
      markbotMain.send('check-group:item-complete', group, file.path, file.path, [`${message} — \`${filename}\` on line ${line}`]);
      next();
    });

    ipcMain.on('__markbot-functionality-test-pass-' + listenerLabel, function(event) {
      if (file.tests.length > 0) {
        currentTestIndex++
        runTest(win, file.tests.shift(), currentTestIndex, listenerLabel);
      } else {
        cleanup();
        markbotMain.send('check-group:item-complete', group, file.path, file.path);
        next();
      }
    });

    ipcMain.on('__markbot-functionality-test-fail-' + listenerLabel, function(event, reason) {
      cleanup();
      markbotMain.send('check-group:item-complete', group, file.path, file.path, [`The website isn’t functioning as expected: ${reason}`]);
      next();
    });

    ipcMain.on('__markbot-functionality-test-debug-' + listenerLabel, function (event, ...e) {
      markbotMain.debug(...e);
    });

    webLoader.load(file.path, {}, function (theWindow) {
      win = theWindow;

      if (file.tests) runTest(win, file.tests.shift(), currentTestIndex, listenerLabel);

      if (file.noErrors) {
        markbotMain.send('check-group:item-complete', group, file.path, file.path);
        next();
      }
    });
  };

  const checkIfDone = function () {
    totalFiles--;

    if (totalFiles <= 0) done();
  };

  taskDetails.options.files.forEach(function (file) {
    totalFiles++;
    check(file, checkIfDone);
  });
}());
