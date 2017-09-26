const __MarkbotInjectedFunctions = {

  failed: false,

  $: function (sel, trgt = document) {
    try {
      const result = trgt.querySelector(sel);

      if (!result) __MarkbotInjectedFunctions.fail(`The element: \`${sel}\` doesn’t exist on the page`);

      return result;
    } catch (e) {
      __MarkbotInjectedFunctions.debugFail(e);
    }
  },

  $$: function (sel, trgt = document) {
    try {
      const results = trgt.querySelectorAll(sel);

      if (!results) __MarkbotInjectedFunctions.fail(`The \`${sel}\` elements don’t exist on the page`);

      return results;
    } catch (e) {
      __MarkbotInjectedFunctions.debugFail(e);
    }
  },

  css: function (elem) {
    try {
      return getComputedStyle(elem);
    } catch (e) {
      __MarkbotInjectedFunctions.debugFail(e);
    }
  },

  bounds: function (elem) {
    try {
      return elem.getBoundingClientRect();
    } catch (e) {
      __MarkbotInjectedFunctions.debugFail(e);
    }
  },

  offset: function (elem) {
    try {
      let bounds = elem.getBoundingClientRect();

      return {
        left: bounds.left + window.scrollX,
        top: bounds.top + window.scrollY,
      };
    } catch (e) {
      __MarkbotInjectedFunctions.debugFail(e);
    }
  },

  on: function (sel, evt, next, timeoutLength = 2000) {
    try {
      let eventHandlerTimeout;

      document.addEventListener(evt, function (e) {
        try {
          if ((typeof sel != 'string' && e.target === sel) || (typeof sel == 'string' && e.target.matches(sel))) {
            clearTimeout(eventHandlerTimeout);
            next(false, e);
          }
        } catch (e) {
          __MarkbotInjectedFunctions.debugFail(e);
        }
      });

      eventHandlerTimeout = setTimeout(function () {
        clearTimeout(eventHandlerTimeout);
        next(true);
      }, timeoutLength);
    } catch (e) {
      __MarkbotInjectedFunctions.debugFail(e);
    }
  },

  ev: function (eventStr, opts = {}) {
    try {
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
    } catch (e) {
      __MarkbotInjectedFunctions.debugFail(e);
    }
  },

  send: function (eventStr, opts = {}, next = null) {
    try {
      let defaultOpts = { type: eventStr, isTrusted: true };
      let allOpts = Object.assign(defaultOpts, opts);

      window.__markbot.sendInputEventToWindow(__MarkbotInjectedFunctions.browserWindowId, allOpts);

      if (next) {
        setTimeout(function () {
          window.requestAnimationFrame(function () {
            window.requestAnimationFrame(function () {
              window.requestAnimationFrame(function () {
                next();
              });
            });
          });
        }, 50);
      }
    } catch (e) {
      __MarkbotInjectedFunctions.debugFail(e);
    }
  },

  sendTrustedMouseEvent: function (sel, ev, errType, next) {
    try {
      const elem = (typeof sel === 'string') ? __MarkbotInjectedFunctions.$(sel) : sel;
      let rect, x, y;

      elem.scrollIntoView();

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          rect = elem.getBoundingClientRect();
          x = Math.round(rect.left + (rect.width / 2));
          y = Math.round(rect.top + (rect.height / 2));

          // if (window.outerHeight < y) window.resizeTo(window.outerWidth, y + 100);
          // if (window.outerWidth < x) window.resizeTo(x + 100, window.outerHeight);
          if (rect.width <= 0) return __MarkbotInjectedFunctions.fail(`Markbot can’t ${errType} the element \`${sel}\` because its width is \`0px\``);
          if (rect.height <= 0) return __MarkbotInjectedFunctions.fail(`Markbot can’t ${errType} the element \`${sel}\` because its height is \`0px\``);

          __MarkbotInjectedFunctions.send(ev, {
            x: (x < 0) ? 0 : x,
            y: (y < 0) ? 0 : y,
          }, next);
        });
      });
    } catch (e) {
      __MarkbotInjectedFunctions.debugFail(e);
    }
  },

  hover: function (sel, next) {
    __MarkbotInjectedFunctions.sendTrustedMouseEvent(sel, 'mouseMove', 'hover', next);
  },

  activate: function (sel, next) {
    __MarkbotInjectedFunctions.sendTrustedMouseEvent(sel, 'mouseDown', 'activate', next);
  },

  done: function () {
    window.__markbot.sendMessageToWindow(__MarkbotInjectedFunctions.taskRunnerId, __MarkbotInjectedFunctions.doneLabel, __MarkbotInjectedFunctions.browserWindowId);
  },

  pass: function () {
    if (!__MarkbotInjectedFunctions.failed) window.__markbot.sendMessageToWindow(__MarkbotInjectedFunctions.taskRunnerId, __MarkbotInjectedFunctions.passLabel);
  },

  fail: function (reason) {
    __MarkbotInjectedFunctions.failed = true;
    window.__markbot.sendMessageToWindow(__MarkbotInjectedFunctions.taskRunnerId, __MarkbotInjectedFunctions.failLabel, reason);
  },

  convertElementToString: function (elem) {
    const id = (elem.id) ? `#${elem.id}` : '';
    let classes = [];

    if (elem.classList.length > 0) {
      for (let theClass of elem.classList) {
        classes.push(`.${theClass}`);
      }
    }

    return '&lt;' + elem.tagName.toLowerCase() + id + classes.join('') + '&gt;';
  },

  convertNodeListToString: function (elems) {
    const prettyElems = [];

    for (let elem of elems) {
      prettyElems.push(__MarkbotInjectedFunctions.convertElementToString(elem));
    }

    return `[${prettyElems.join(', ')}]`;
  },

  debug: function (...message) {
    let args = message.map((arg) => {
      if (arg instanceof NodeList) return __MarkbotInjectedFunctions.convertNodeListToString(arg);
      if (arg instanceof HTMLElement) return __MarkbotInjectedFunctions.convertElementToString(arg);
      if (arg === null) return 'null';
      if (arg === void 0) return 'undefined';
      if (typeof arg === 'object' && arg.toString) return arg.toString();

      return arg;
    });

    window.__markbot.sendMessageToWindow(__MarkbotInjectedFunctions.taskRunnerId, __MarkbotInjectedFunctions.debugLabel, ...args);
  },

  debugFail: function (e) {
    if (e.message) __MarkbotInjectedFunctions.debug(`Functionality testing error, test #${__MarkbotInjectedFunctions.testIndex} —`, e.message);
    __MarkbotInjectedFunctions.fail('Double check the Javascript');
  },

};
