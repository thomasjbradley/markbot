const $ = function (sel, trgt = document) {
  return trgt.querySelector(sel);
};

const $$ = function (sel, trgt = document) {
  return trgt.querySelectorAll(sel);
};

const css = function (elem) {
  return getComputedStyle(elem);
};

const ev = function (eventStr, opts) {
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
};
