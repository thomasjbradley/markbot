'use strict';

const create = function () {
  let queueStart = [];
  let queue = [];
  let queueEnd = [];

  const addStart = function (task) {
    queueStart.push(task);
  };

  const addEnd = function (task) {
    queueEnd.push(task);
  };

  const add = function (task) {
    queue.push(task);
  };

  const next = function () {
    if (queueStart.length > 0) return queueStart.shift();
    if (queue.length > 0) return queue.shift();
    if (queueEnd.length > 0) return queueEnd.shift();

    return false;
  };

  const has = function () {
    if (queueStart.length > 0) return true;
    if (queue.length > 0) return true;
    if (queueEnd.length > 0) return true;

    return false;
  };

  const length = function () {
    return queueStart.length + queue.length + queueEnd.length;
  };

  return {
    add: add,
    addStart: addStart,
    addEnd: addEnd,
    next: next,
    has: has,
    length: length,
  };
};

module.exports = {
  create: create,
};
