'use strict';

const path = require('path');
const fs = require('fs');

let injectionJs = false;

const makeExecTestJs = function (js, testIndex, label, testWinId) {
  if (!injectionJs) injectionJs = fs.readFileSync(path.resolve(`${__dirname}/functionality-methods.js`), 'utf8');

  return `
    (function () {
      ${injectionJs}

      __MarkbotInjectedFunctions.testIndex = ${testIndex};
      __MarkbotInjectedFunctions.browserWindowId = ${testWinId};
      __MarkbotInjectedFunctions.taskRunnerId = ${taskRunnerId};
      __MarkbotInjectedFunctions.doneLabel = '__markbot-functionality-test-done-${label}';
      __MarkbotInjectedFunctions.passLabel = '__markbot-functionality-test-pass-${label}';
      __MarkbotInjectedFunctions.failLabel = '__markbot-functionality-test-fail-${label}';
      __MarkbotInjectedFunctions.debugLabel = '__markbot-functionality-test-debug-${label}';

      __MarkbotInjectedFunctions.send('mouseMove', { x: -10, y: -10 }, () => {
        (function ($, $$, css, bounds, offset, on, ev, send, hover, activate, done, pass, fail, debug) {
          'use strict';

          try {
            eval(${js});
          } catch (e) {
            __MarkbotInjectedFunctions.debugFail(e);
          }
        }(
          __MarkbotInjectedFunctions.$,
          __MarkbotInjectedFunctions.$$,
          __MarkbotInjectedFunctions.css,
          __MarkbotInjectedFunctions.bounds,
          __MarkbotInjectedFunctions.offset,
          __MarkbotInjectedFunctions.on,
          __MarkbotInjectedFunctions.ev,
          __MarkbotInjectedFunctions.send,
          __MarkbotInjectedFunctions.hover,
          __MarkbotInjectedFunctions.activate,
          __MarkbotInjectedFunctions.done,
          __MarkbotInjectedFunctions.pass,
          __MarkbotInjectedFunctions.fail,
          __MarkbotInjectedFunctions.debug
        ));
      });
    }());
  `;
};

const runCode = function (win, testJs, testIndex, listenerLabel) {
  let bindFunction = `
    (function () {
      'use strict';

      window.__markbot.playAnimations();
      setTimeout(() => {
        __MarkbotInjectedFunctions.fail('The Markbot requirements test code took too long to run or didn’t execute the required \`done()\` or \`pass()\` functions');
      }, 7000);

      ${testJs.trim()}
    }());
  `;

  let js = makeExecTestJs(JSON.stringify(bindFunction), testIndex, listenerLabel, win.id);

  win.webContents.executeJavaScript(js);
};

module.exports = {
  runCode: runCode,
};
