const __MarkbotInjectedFunctions = {

  ipcRenderer: nodeRequire('electron').ipcRenderer,
  browserWindow: nodeRequire('electron').remote.BrowserWindow,

  $: function (sel, trgt = document) {
    const result = trgt.querySelector(sel);

    if (!result) __MarkbotInjectedFunctions.fail(`The element: \`${sel}\` doesn’t exist on the page`);

    return result;
  },

  $$: function (sel, trgt = document) {
    const results = trgt.querySelectorAll(sel);

    if (!results) __MarkbotInjectedFunctions.fail(`The \`${sel}\` elements don’t exist on the page`);

    return results;
  },

  css: function (elem) {
    return getComputedStyle(elem);
  },

  on: function (sel, evt, next, timeoutLength = 2000) {
    let eventHandlerTimeout;

    document.addEventListener(evt, function (e) {
      if (e.target.matches(sel)) {
        clearTimeout(eventHandlerTimeout);
        next(false, e);
      }
    });

    eventHandlerTimeout = setTimeout(function () {
      clearTimeout(eventHandlerTimeout);
      next(true);
    }, timeoutLength);
  },

  ev: function (eventStr, opts = {}) {
    let defaultOpts = { bubbles: true, cancelable: true };
    let allOpts = Object.assign(defaultOpts, opts);

    switch (eventStr) {
      case 'click':
      case 'dblclick':
      case 'mouseup':
      case 'mousedown':
      case 'mouseover':
      case 'mouseout':
      case 'mouseenter':
      case 'mouseleave':
      case 'mousemove':
        return new MouseEvent(eventStr, allOpts);
        break;
      case 'keypress':
      case 'keydown':
      case 'keyup':
        return new KeyboardEvent(eventStr, allOpts);
        break;
      default:
        return new Event(eventStr, allOpts);
        break;
    }
  },

  send: function (eventStr, opts = {}, next = null) {
    const win = __MarkbotInjectedFunctions.browserWindow.fromId(__MarkbotInjectedFunctions.browserWindowID);
    let defaultOpts = { type: eventStr, isTrusted: true };
    let allOpts = Object.assign(defaultOpts, opts);

    win.webContents.sendInputEvent(allOpts);

    if (next) {
      setTimeout(function () {
        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(function () {
            window.requestAnimationFrame(function () {
              next()
            });
          });
        });
      }, 50);
    }
  },

  hover: function (sel, next) {
    const elem = document.querySelector(sel);
    const rect = elem.getBoundingClientRect();
    let x = Math.round(rect.left + (rect.width / 2));
    let y = Math.round(rect.top + (rect.height / 2));

    __MarkbotInjectedFunctions.send('mouseMove', {
      x: (x < 0) ? 0 : x,
      y: (y < 0) ? 0 : y
    }, next);
  },

  pass: function () {
    __MarkbotInjectedFunctions.ipcRenderer.send(__MarkbotInjectedFunctions.passLabel);
  },

  fail: function (reason) {
    __MarkbotInjectedFunctions.ipcRenderer.send(__MarkbotInjectedFunctions.failLabel, reason);
  },

  debug: function (...message) {
    __MarkbotInjectedFunctions.ipcRenderer.send(__MarkbotInjectedFunctions.debugLabel, ...message);
  }

};
