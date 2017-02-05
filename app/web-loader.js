'use strict';

const PRELOAD_JS = __dirname + '/hidden-browser-window-preload.js';
const PRELOAD_PATH = 'chrome://ensure-electron-resolution/';

const path = require('path');
const ipcRenderer = require('electron').ipcRenderer;
const BrowserWindow = require('electron').remote.BrowserWindow;
const markbotMain = require('electron').remote.require('./app/markbot-main');
const networks = require(__dirname + '/networks');
const webServer = require(__dirname + '/web-server');
const appPkg = require(__dirname + '/../package.json');

const ENV = process.env.NODE_ENV;
const DEBUG = (ENV === 'development');

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

const load = function (listenerId, url, opts, next) {
  let win;
  let speed = false;
  let networkName;
  let didFinishLoad = false;
  let domReady = false;
  let windowLoaded = false;
  let fontsReady = false;
  let onFinishLoadFired = false;

  const cleanup = function () {
    ipcRenderer.removeAllListeners('__markbot-hidden-browser-devtools-loaded');
    ipcRenderer.removeAllListeners('__markbot-hidden-browser-window-loaded');
    ipcRenderer.removeAllListeners('__markbot-hidden-browser-window-fonts-loaded');
    ipcRenderer.removeAllListeners('__markbot-hidden-browser-har-generation-succeeded');
    win.closeDevTools();
  };

  const notifyDevToolsExtensionOfLoad = function (loc) {
    if (loc != PRELOAD_PATH) {
      win.webContents.executeJavaScript('new Image().src = "https://did-finish-load/"');
    }
  };

  const waitForFinalLoad = function (loc) {
    // The `did-finish-load` & `dom-ready` events often fire too soon to execute JS in the window
    const isLoading = setInterval(function () {
      if (!win.webContents.isLoading()) {
        clearInterval(isLoading);
        notifyDevToolsExtensionOfLoad(loc);
      }
    }, 20);
  };

  const checkForFinalLoad = function (loc) {
    if (loc != PRELOAD_PATH && didFinishLoad && domReady && windowLoaded && fontsReady && !onFinishLoadFired) {
      onFinishLoadFired = true;
      waitForFinalLoad(loc);
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
      checkForFinalLoad(e.sender.getURL());
    }
  });

  win.webContents.on('dom-ready', function (e) {
    if (e.sender.getURL() != PRELOAD_PATH) {
      domReady = true;
      checkForFinalLoad(e.sender.getURL());
    }
  });

  ipcRenderer.on('__markbot-hidden-browser-devtools-loaded', function (e) {
    process.nextTick(function () {
      win.loadURL(getUrl(url), {'extraHeaders': 'Pragma: no-cache\n'});
      win.webContents.executeJavaScript(`window.__markbot_hidden_browser_window_id = ${listenerId};`);
    });
  });

  ipcRenderer.on('__markbot-hidden-browser-window-fonts-loaded', function (e, details) {
    if (details.location != PRELOAD_PATH) {
      fontsReady = true;
      checkForFinalLoad(details.location);
    }
  });

  ipcRenderer.on('__markbot-hidden-browser-window-loaded', function (e, details) {
    if (details.location != PRELOAD_PATH) {
      windowLoaded = true;
      checkForFinalLoad(details.location);
    }
  });

  ipcRenderer.once('__markbot-hidden-browser-har-generation-succeeded', function (e, har) {
    cleanup();
    next(win, har);
  });

  win.openDevTools({mode: 'bottom'});

  if (speed) {
    markbotMain.debug(`Network: ${networkName}, ${speed.latency}ms⬌, ${speed.downloadThroughput}kB/s⬇, ${speed.uploadThroughput}kB/s⬆`)
    win.webContents.session.enableNetworkEmulation(speed);
  }

  win.loadURL(PRELOAD_PATH, {'extraHeaders': 'Pragma: no-cache\n'});
  win.webContents.executeJavaScript(`window.__markbot_hidden_browser_window_id = ${listenerId};`);
};

module.exports = {
  load: load,
  destroy: destroy,
};
