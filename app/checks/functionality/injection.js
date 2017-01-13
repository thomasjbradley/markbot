const __MarkbotInjectedFunctions = {

  failed: false,

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

  bounds: function (elem) {
    return elem.getBoundingClientRect();
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
    let defaultOpts = { type: eventStr, isTrusted: true };
    let allOpts = Object.assign(defaultOpts, opts);

    __MarkbotInjectedFunctions.browserWindow.sendInputEvent(allOpts);

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

    if (window.outerHeight < y) window.resizeTo(window.outerWidth, y + 100);
    if (window.outerWidth < x) window.resizeTo(x + 100, window.outerHeight);
    if (rect.width <= 0) __MarkbotInjectedFunctions.fail(`Markbot can’t hover the element \`${sel}\` because its width is \`0px\``);
    if (rect.height <= 0) __MarkbotInjectedFunctions.fail(`Markbot can’t hover the element \`${sel}\` because its height is \`0px\``);

    __MarkbotInjectedFunctions.send('mouseMove', {
      x: (x < 0) ? 0 : x,
      y: (y < 0) ? 0 : y
    }, next);
  },

  pass: function () {
    if (!__MarkbotInjectedFunctions.failed) __MarkbotInjectedFunctions.taskRunner.send(__MarkbotInjectedFunctions.passLabel);
  },

  fail: function (reason) {
    __MarkbotInjectedFunctions.failed = true;
    __MarkbotInjectedFunctions.taskRunner.send(__MarkbotInjectedFunctions.failLabel, reason);
  },

  debug: function (...message) {
    __MarkbotInjectedFunctions.taskRunner.send(__MarkbotInjectedFunctions.debugLabel, ...message);
  }

};
