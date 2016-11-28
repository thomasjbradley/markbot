'use strict';

const PRELOAD_JS = __dirname + '/hidden-browser-window-preload.js';
const PRELOAD_PATH = 'chrome://ensure-electron-resolution/';

const path = require('path');
const ipcMain = require('electron').ipcMain;
const BrowserWindow = require('electron').BrowserWindow;
const networks = require('./networks');
const webServer = require('./web-server');
const markbotMain = require('./markbot-main');
const appPkg = require('../package.json');

const DEBUG = appPkg.config.DEBUG;

const getNewBrowserWindow = function (userOpts) {
  const defaultOpts = {
    width: 1000,
    height: 600,
  };
  const opts = Object.assign(defaultOpts, userOpts);

  return new BrowserWindow({
    x: (DEBUG) ? 100 : 5000,
    y: (DEBUG) ? 100 : 5000,
    center: false,
    width: opts.width,
    height: opts.height,
    show: (DEBUG) ? true : false,
    frame: (DEBUG) ? true : false,
    enableLargerThanScreen: true,
    backgroundColor: '#fff',
    webPreferences: {
      nodeIntegration: true,
      preload: path.resolve(PRELOAD_JS),
    },
    defaultEncoding: 'UTF-8',
  });
};

const getUrl = function (url) {
  return (url.match(/^https?:\/\//)) ? url : webServer.getHost() + '/' + url;
};

const destroy = function (win) {
  if (!DEBUG) {
    if (win) win.destroy();
    win = null;
  }
};

const load = function (url, opts, next) {
  let win;
  let speed = false;
  let networkName;
  let didFinishLoad = false;
  let domReady = false;
  let windowLoaded = false;
  let fontsReady = false;
  let onFinishLoadFired = false;

  const cleanup = function () {
    ipcMain.removeAllListeners('__markbot-hidden-browser-devtools-loaded');
    ipcMain.removeAllListeners('__markbot-hidden-browser-window-loaded');
    ipcMain.removeAllListeners('__markbot-hidden-browser-window-fonts-loaded');
    ipcMain.removeAllListeners('__markbot-hidden-browser-har-generation-succeeded');
    win.closeDevTools();
  };

  const notifyDevToolsExtensionOfLoad = function (e) {
    if (e.sender.getURL() != PRELOAD_PATH) {
      win.webContents.executeJavaScript('new Image().src = "https://did-finish-load/"');
    }
  };

  const waitForFinalLoad = function (e) {
    // The `did-finish-load` & `dom-ready` events often fire too soon to execute JS in the window
    const isLoading = setInterval(function () {
      if (!win.webContents.isLoading()) {
        clearInterval(isLoading);
        notifyDevToolsExtensionOfLoad(e);
      }
    }, 20);
  };

  const checkForFinalLoad = function (e) {
    if (e.sender.getURL() != PRELOAD_PATH && didFinishLoad && domReady && windowLoaded && fontsReady && !onFinishLoadFired) {
      onFinishLoadFired = true;
      waitForFinalLoad(e);
    }
  };

  BrowserWindow.removeDevToolsExtension('devtools-har-extension');
  BrowserWindow.addDevToolsExtension(path.resolve(__dirname + '/../devtools-har-extension'));

  if (opts.speed && networks[opts.speed]) {
    speed = networks[opts.speed];
    networkName = opts.speed;
    delete opts.speed;
  }

  win = getNewBrowserWindow(opts);

  win.webContents.on('did-finish-load', function (e) {
    if (e.sender.getURL() != PRELOAD_PATH) {
      didFinishLoad = true;
      checkForFinalLoad(e);
    }
  });

  win.webContents.on('dom-ready', function (e) {
    if (e.sender.getURL() != PRELOAD_PATH) {
      domReady = true;
      checkForFinalLoad(e);
    }
  });

  ipcMain.on('__markbot-hidden-browser-devtools-loaded', function (e) {
    process.nextTick(function () {
      win.loadURL(getUrl(url), {'extraHeaders': 'Pragma: no-cache\n'});
    });
  });

  ipcMain.on('__markbot-hidden-browser-window-fonts-loaded', function (e, details) {
    if (e.sender.getURL() != PRELOAD_PATH) {
      fontsReady = true;
      checkForFinalLoad(e);
    }
  });

  ipcMain.on('__markbot-hidden-browser-window-loaded', function (e, details) {
    if (e.sender.getURL() != PRELOAD_PATH) {
      windowLoaded = true;
      checkForFinalLoad(e);
    }
  });

  ipcMain.once('__markbot-hidden-browser-har-generation-succeeded', function (e, har) {
    cleanup();
    next(win, har);
  });

  win.openDevTools({mode: 'bottom'});

  if (speed) {
    markbotMain.debug(`Network: ${networkName}, ${speed.latency}ms⬌, ${speed.downloadThroughput}kB/s⬇, ${speed.uploadThroughput}kB/s⬆`)
    win.webContents.session.enableNetworkEmulation(speed);
  }

  win.loadURL(PRELOAD_PATH, {'extraHeaders': 'Pragma: no-cache\n'});
};

module.exports = {
  load: load,
  destroy: destroy,
};
