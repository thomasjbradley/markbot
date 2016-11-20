'use strict';

const webLoader = require('./web-loader');

let loadQueue = [];
let currentWindow;

const add = function (queueUrl, queueOpts, queueNext) {
  loadQueue.push({
    url: queueUrl,
    opts: queueOpts,
    next: queueNext,
  });

  if (loadQueue.length === 1 && !currentWindow) next();
};

const next = function () {
  let current;

  if (currentWindow) {
    webLoader.destroy(currentWindow);
    currentWindow = null;
  }

  if (loadQueue.length <= 0) return;

  current = loadQueue.shift();

  webLoader.load(current.url, current.opts, function (win, har) {
    currentWindow = win;
    current.next(win, har);
  });
};

module.exports = {
  add: add,
  next: next,
};
