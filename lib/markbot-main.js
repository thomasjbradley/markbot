'use strict';

let markbotMain;

const init = function (main) {
  markbotMain = main;
};

const send = function (label, ...messages) {
  markbotMain.send(label, ...messages);
};

const debug = function (...messages) {
  send('debug', ...messages);
};

module.exports = {
  init: init,
  send: send,
  debug: debug,
};
