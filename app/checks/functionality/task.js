(function () {
  'use strict';

  const path = require('path');
  const ipcRenderer = require('electron').ipcRenderer;
  const markbotMain = require('electron').remote.require('./app/markbot-main');
  const fileExists = require(__dirname + '/file-exists');
  const classify = require(__dirname + '/classify');
  const webLoader = require(__dirname + '/web-loader');
  const functionalityInjector = require(__dirname + '/functionality-injector');

  const group = taskDetails.group;
  const fullPath = taskDetails.cwd;

  let filesToCheck = JSON.parse(JSON.stringify(taskDetails.options.files));

  const check = function (file, next) {
    const pagePath = path.resolve(fullPath + '/' + file.path);
    const listenerLabel = file.listenerLabel;
    const displayLabel = file.displayLabel;
    let currentTestIndex = 1;
    let hasErrors = false;
    let win;

    if (file.test) file.tests = file.test;
    if (!Array.isArray(file.tests)) file.tests = [file.tests];

    const cleanup = function () {
      ipcRenderer.removeAllListeners('__markbot-functionality-error');
      ipcRenderer.removeAllListeners('__markbot-functionality-test-pass-' + listenerLabel);
      ipcRenderer.removeAllListeners('__markbot-functionality-test-fail-' + listenerLabel);
      ipcRenderer.removeAllListeners('__markbot-functionality-test-debug-' + listenerLabel);

      webLoader.destroy(win);
      win = null;
    };


    if (!fileExists.check(pagePath)) {
      markbotMain.send('check-group:item-complete', group, listenerLabel, displayLabel, [`The file \`${file.path}\` is missing or misspelled`]);
      return next();
    }

    markbotMain.send('check-group:item-computing', group, listenerLabel, displayLabel);

    ipcRenderer.on('__markbot-functionality-error', function (event, message, line, filename) {
      hasErrors = true;
      filename = filename.replace(fullPath, '').replace('file:///', '');
      cleanup();

      if (message) message = message.replace(/\.$/, '');
      if (filename) filename = filename.replace(/https?:\/\/(localhost|127\.0\.0\.1):?\d+\//, '');

      if (message && !filename && !line) markbotMain.send('check-group:item-complete', group, listenerLabel, displayLabel, [`${message}`]);
      if (message && filename && !line) markbotMain.send('check-group:item-complete', group, listenerLabel, displayLabel, [`${message} — \`${filename}\``]);
      if (message && filename && line) markbotMain.send('check-group:item-complete', group, listenerLabel, displayLabel, [`${message} — \`${filename}\` on line ${line}`]);

      next();
    });

    ipcRenderer.on('__markbot-functionality-test-pass-' + listenerLabel, function(event) {
      if (file.tests.length > 0) {
        currentTestIndex++
        functionalityInjector.runCode(win, file.tests.shift(), currentTestIndex, listenerLabel);
      } else {
        cleanup();
        markbotMain.send('check-group:item-complete', group, listenerLabel, displayLabel);
        next();
      }
    });

    ipcRenderer.on('__markbot-functionality-test-fail-' + listenerLabel, function(event, reason) {
      cleanup();
      markbotMain.send('check-group:item-complete', group, listenerLabel, displayLabel, [`The website isn’t functioning as expected: ${reason}`]);
      next();
    });

    ipcRenderer.on('__markbot-functionality-test-debug-' + listenerLabel, function (event, ...e) {
      markbotMain.debug(...e);
    });

    webLoader.load(taskRunnerId, file.path, {}, (file.setup) ? file.setup : false, function (theWindow) {
      win = theWindow;

      if (file.noErrors && !hasErrors) {
        markbotMain.send('check-group:item-complete', group, listenerLabel, displayLabel);
        next();
      } else {
        if (file.tests && Array.isArray(file.tests) && file.tests.length > 0) {
          functionalityInjector.runCode(win, file.tests.shift(), currentTestIndex, listenerLabel);
        }
      }
    });
  };

  const checkNext = function () {
    if (filesToCheck.length <= 0) return done();

    check(filesToCheck.shift(), checkNext);
  };

  filesToCheck.forEach((file, i) => {
    filesToCheck[i].listenerLabel = classify(`${file.path}-${Date.now()}`);
    filesToCheck[i].displayLabel = (file.label) ? `${file.path} — ${file.label}` : file.path;

    markbotMain.send('check-group:item-new', group, filesToCheck[i].listenerLabel, filesToCheck[i].displayLabel);
  });

  checkNext();
}());
