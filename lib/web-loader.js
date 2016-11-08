'use strict';

const PRELOAD_JS = __dirname + '/hidden-browser-window-preload.js';

const path = require('path');
const ipcMain = require('electron').ipcMain;
const electron = require('electron');
const app = electron.app;
const BrowserWindow = require('electron').BrowserWindow;

const getNewBrowserWindow = function (userOpts) {
  const defaultOpts = {
    width: 1000,
    height: 600,
  };
  const opts = Object.assign(defaultOpts, userOpts);

  return new BrowserWindow({
    x: 0,
    y: 0,
    center: false,
    width: opts.width,
    height: opts.height,
    show: false,
    frame: false,
    enableLargerThanScreen: true,
    backgroundColor: '#fff',
    webPreferences: {
      nodeIntegration: true,
      preload: path.resolve(PRELOAD_JS),
    },
    defaultEncoding: 'UTF-8',
  });
};

const destroy = function (win) {
  if (win) win.destroy();
  win = null;
};

const load = function (url, opts, next) {
  let win = getNewBrowserWindow(opts);
  let didFinishLoad = false;
  let domReady = false;
  let windowLoaded = false;
  let fontsReady = false;
  let onFinishLoadFired = false;

  const cleanup = function () {
    ipcMain.removeAllListeners('__markbot-hidden-browser-window-loaded');
    ipcMain.removeAllListeners('__markbot-hidden-browser-window-fonts-loaded');
  };

  const waitForFinalLoad = function () {
    // The `did-finish-load` & `dom-ready` events often fire too soon to execute JS in the window
    const isLoading = setInterval(function () {
      if (!win.webContents.isLoading()) {
        clearInterval(isLoading);
        cleanup();
        next(win);
      }
    }, 20);
  };

  const checkForFinalLoad = function () {
    if (didFinishLoad && domReady && windowLoaded && fontsReady && !onFinishLoadFired) {
      onFinishLoadFired = true;
      waitForFinalLoad();
    }
  };

  win.webContents.on('did-finish-load', function () {
    didFinishLoad = true;
    checkForFinalLoad();
  });

  win.webContents.on('dom-ready', function () {
    domReady = true;
    checkForFinalLoad();
  });

  ipcMain.on('__markbot-hidden-browser-window-fonts-loaded', function (event, details) {
    fontsReady = true;
    checkForFinalLoad();
  });

  ipcMain.on('__markbot-hidden-browser-window-loaded', function (event, details) {
    windowLoaded = true;
    checkForFinalLoad();
  });

  win.loadURL(url, {'extraHeaders': 'pragma: no-cache\n'});
};

module.exports = {
  load: load,
  destroy: destroy,
};
