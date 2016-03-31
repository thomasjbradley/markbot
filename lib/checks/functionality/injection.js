const __MarkbotInjectedFunctions = {

  ipcRenderer: nodeRequire('electron').ipcRenderer,

  $: function (sel, trgt = document) {
    let result = trgt.querySelector(sel);

    if (!result) __MarkbotInjectedFunctions.fail(`The element: \`${sel}\` doesn’t exist on the page`);

    return result;
  },

  $$: function (sel, trgt = document) {
    let results = trgt.querySelectorAll(sel);

    if (!results) __MarkbotInjectedFunctions.fail(`The \`${sel}\` elements don’t exist on the page`);

    return results;
  },

  css: function (elem) {
    return getComputedStyle(elem);
  },

  on: function (sel, evt, callback, timeoutLength = 2000) {
    let eventHandlerTimeout;

    document.addEventListener(evt, function (e) {
      if (e.target.matches(sel)) {
        clearTimeout(eventHandlerTimeout);
        callback(false, e);
      }
    });

    eventHandlerTimeout = setTimeout(function () {
      clearTimeout(eventHandlerTimeout);
      callback(true);
    }, timeoutLength);
  },

  ev: function (eventStr, opts) {
    let defaultOpts = {bubbles: true, cancelable: true};
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
