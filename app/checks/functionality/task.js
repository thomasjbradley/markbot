(function () {
  'use strict';

  const fs = require('fs');
  const path = require('path');
  const ipcRenderer = require('electron').ipcRenderer;
  const markbotMain = require('electron').remote.require('./app/markbot-main');
  const fileExists = require(__dirname + '/file-exists');
  const classify = require(__dirname + '/classify');
  const webLoader = require(__dirname + '/web-loader');
  const defaultsService = require(__dirname + '/checks/functionality/defaults-service');
  const injectionJs = defaultsService.get('injection.js');

  const group = taskDetails.group;
  const fullPath = taskDetails.cwd;

  let totalFiles = 0;

  const makeExecTestJs = function (js, testIndex, label, testWinId) {
    return `
      (function () {
        ${injectionJs}

        __MarkbotInjectedFunctions.browserWindowId = ${testWinId};
        __MarkbotInjectedFunctions.browserWindow = nodeRequire('electron').remote.BrowserWindow.fromId(${testWinId}).webContents;
        __MarkbotInjectedFunctions.taskRunnerId = ${taskRunnerId};
        __MarkbotInjectedFunctions.taskRunner = nodeRequire('electron').remote.BrowserWindow.fromId(${taskRunnerId}).webContents;
        __MarkbotInjectedFunctions.passLabel = '__markbot-functionality-test-pass-${label}';
        __MarkbotInjectedFunctions.failLabel = '__markbot-functionality-test-fail-${label}';
        __MarkbotInjectedFunctions.debugLabel = '__markbot-functionality-test-debug-${label}';

        (function ($, $$, css, bounds, on, ev, send, hover, pass, fail, debug) {
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
          __MarkbotInjectedFunctions.bounds,
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
      ipcRenderer.removeAllListeners('__markbot-functionality-error');
      ipcRenderer.removeAllListeners('__markbot-functionality-test-pass-' + listenerLabel);
      ipcRenderer.removeAllListeners('__markbot-functionality-test-fail-' + listenerLabel);
      ipcRenderer.removeAllListeners('__markbot-functionality-test-debug-' + listenerLabel);

      webLoader.destroy(win);
      win = null;
    };

    markbotMain.send('check-group:item-new', group, file.path, file.path);

    if (!fileExists.check(pagePath)) {
      markbotMain.send('check-group:item-complete', group, file.path, file.path, [`The file \`${file.path}\` is missing or misspelled`]);
      return next();
    }

    markbotMain.send('check-group:item-computing', group, file.path, file.path);

    ipcRenderer.on('__markbot-functionality-error', function (event, message, line, filename) {
      filename = filename.replace(fullPath, '').replace('file:///', '');
      cleanup();
      markbotMain.send('check-group:item-complete', group, file.path, file.path, [`${message} — \`${filename}\` on line ${line}`]);
      next();
    });

    ipcRenderer.on('__markbot-functionality-test-pass-' + listenerLabel, function(event) {
      if (file.tests.length > 0) {
        currentTestIndex++
        runTest(win, file.tests.shift(), currentTestIndex, listenerLabel);
      } else {
        cleanup();
        markbotMain.send('check-group:item-complete', group, file.path, file.path);
        next();
      }
    });

    ipcRenderer.on('__markbot-functionality-test-fail-' + listenerLabel, function(event, reason) {
      cleanup();
      markbotMain.send('check-group:item-complete', group, file.path, file.path, [`The website isn’t functioning as expected: ${reason}`]);
      next();
    });

    ipcRenderer.on('__markbot-functionality-test-debug-' + listenerLabel, function (event, ...e) {
      markbotMain.debug(...e);
    });

    webLoader.load(taskRunnerId, file.path, {}, function (theWindow) {
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
