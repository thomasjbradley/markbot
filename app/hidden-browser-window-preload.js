/*!
 * =============================================================================
 * Internal abilities required for Markbot to function
 * Trying to isolate all the Node.js functionality away from the user scripts for security
 * =============================================================================
 */
window.__markbot = (function () {
  'use strict';

  const getCurrentTaskWindowId = function () {
    if (window.__markbotHiddenTestingWindowId) return window.__markbotHiddenTestingWindowId;

    return document.referrer.replace(/^https:\/\//, '').replace(/\.running-task-windows\.markbot\.web\-dev\.tools\/$/, '');
  };

  const sendMessageToWindow = function (windowId, messageId, ...message) {
    if (typeof windowId === 'string') windowId = parseInt(windowId, 10);

    require('electron').remote.BrowserWindow.fromId(windowId).webContents.send(messageId, ...message);
  };

  const sendInputEventToWindow = function (windowId, inputEvent) {
    if (typeof windowId === 'string') windowId = parseInt(windowId, 10);

    require('electron').remote.BrowserWindow.fromId(windowId).webContents.sendInputEvent(inputEvent);
  };

  const getTestingService = function (service) {
    switch (service) {
      case 'perf':
        return require('webcoach');
        break;
      case 'a11y':
        return require('axe-core');
        break;
      default:
        return false;
    }
  };

  return {
    getCurrentTaskWindowId: getCurrentTaskWindowId,
    getTestingService: getTestingService,
    sendMessageToWindow: sendMessageToWindow,
    sendInputEventToWindow: sendInputEventToWindow,
  };
}());

/*!
 * =============================================================================
 * Document & window event catchers for events Markbot needs to know about
 * =============================================================================
 */
window.addEventListener('error', function (err) {
  window.__markbot.sendMessageToWindow(window.__markbot.getCurrentTaskWindowId(), '__markbot-functionality-error', err.message, err.lineno, err.filename);
});

window.addEventListener('load', function (ev) {
  window.requestAnimationFrame(function () {
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          process.nextTick(function () {
            window.__markbot.sendMessageToWindow(window.__markbot.getCurrentTaskWindowId(), '__markbot-hidden-browser-window-loaded', {location: window.location.href});
          });
        });
      });
    });
  });
});

document.fonts.ready.then(function () {
  window.requestAnimationFrame(function () {
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          process.nextTick(function () {
            window.__markbot.sendMessageToWindow(window.__markbot.getCurrentTaskWindowId(), '__markbot-hidden-browser-window-fonts-loaded', {location: window.location.href});
          });
        });
      });
    });
  });
});

/*!
 * =============================================================================
 * Overwrite some Javascript functions so they can be better tested
 * =============================================================================
 */
window.alert = function (str) {
  return true;
};

window.confirm = function (str) {
  return true;
};

window.prompt = function (str) {
  return str;
};
