/*!
 * =============================================================================
 * Internal abilities required for Markbot to function
 * Trying to isolate all the Node.js functionality away from the user scripts for security
 * =============================================================================
 */

window.__markbot = (function () {
  'use strict';

  let fontsLoadedInterval;

  const getCurrentTaskWindowId = () => {
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

  const checkIfFontsDoneLoading = function () {
    if (document.fonts.status === 'loaded') {
      clearInterval(fontsLoadedInterval);

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
              process.nextTick(() => {
                setTimeout(() => {
                  sendMessageToWindow(getCurrentTaskWindowId(), '__markbot-hidden-browser-window-fonts-loaded', {location: window.location.href});
                }, 100);
              });
            });
          });
        });
      });
    }
  };

  fontsLoadedInterval = setInterval(checkIfFontsDoneLoading, 100);

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
window.addEventListener('error', (err) => {
  window.__markbot.sendMessageToWindow(window.__markbot.getCurrentTaskWindowId(), '__markbot-functionality-error', err.message, err.lineno, err.filename);
});

window.addEventListener('load', (ev) => {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          process.nextTick(() => {
            window.__markbot.sendMessageToWindow(window.__markbot.getCurrentTaskWindowId(), '__markbot-hidden-browser-window-loaded', {location: window.location.href});
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
