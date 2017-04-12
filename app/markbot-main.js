'use strict';

const is = require('electron-is');

let markbotMain;

const init = function (main) {
  let electron;

  if (is.renderer()) {
    electron = require('electron').remote;
    markbotMain = electron.BrowserWindow.fromId(electron.getGlobal('markbotMainWindow')).webContents;
  } else {
    electron = require('electron');
    markbotMain = electron.BrowserWindow.fromId(global.markbotMainWindow).webContents;
  }
};

const destroy = function () {
  markbotMain = null;
}

const send = function (label, ...messages) {
  init();
  markbotMain.send(label, ...messages);
  destroy();
};

const debug = function (...messages) {
  send('debug', ...messages);
};

const isDebug = function () {
  if (is.renderer()) {
    return require('electron').remote.getGlobal('DEBUG');
  } else {
    return global.DEBUG;
  }
};

module.exports = {
  send: send,
  debug: debug,
  isDebug: isDebug,
};
