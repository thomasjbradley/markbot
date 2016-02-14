'use strict';

const
  electron = require('electron'),
  app = electron.app,
  Menu = electron.Menu,
  BrowserWindow = electron.BrowserWindow,
  shell = electron.shell
;

const appMenu = require('./lib/menu');
const MARKBOT_FILE = '.markbot.yml';

var
  fs = require('fs'),
  path = require('path'),
  util = require('util'),
  https = require('https'),
  yaml = require('js-yaml'),
  config = require('./config.json'),
  markbotFile = {},
  exists = require('./checks/file-exists'),
  naming = require('./checks/naming-conventions'),
  commits = require('./checks/git-commits'),
  html = require('./checks/html'),
  css = require('./checks/css'),
  mainWindow,
  listener,
  menuCallbacks = {},
  menuOptions = {
    openRepo: false,
    runChecks: false,
    revealFolder: false,
    signOut: false,
    signOutUsername: false,
    showDevelop: false
  },
  currentFolderPath
;

const updateAppMenu = function () {
  Menu.setApplicationMenu(Menu.buildFromTemplate(appMenu.getMenuTemplate(app, mainWindow, listener, menuCallbacks, menuOptions)));
};

const createWindow = function () {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    titleBarStyle: 'hidden-inset'
  });

  mainWindow.loadURL('file://' + __dirname + '/index.html');

  mainWindow.on('closed', function() {
    mainWindow = null;
  });

  listener = mainWindow.webContents;
  updateAppMenu();
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});

exports.revealFolder = function () {
  if (currentFolderPath) {
    shell.showItemInFolder(currentFolderPath);
  }
};
menuCallbacks.revealFolder = exports.revealFolder;

exports.showDevelopMenu = function () {
  menuOptions.showDevelop = true;
  updateAppMenu();

  if (!mainWindow.isDevToolsOpened()) mainWindow.openDevTools();
};

exports.disableFolderMenuFeatures = function () {
  menuOptions.runChecks = false;
  menuOptions.revealFolder = false;
  updateAppMenu();
};

exports.disableSignOut = function () {
  menuOptions.openRepo = false;
  menuOptions.signOut = false;
  menuOptions.signOutUsername = false;
  updateAppMenu();
};

exports.enableSignOut = function (username) {
  menuOptions.openRepo = true;
  menuOptions.signOut = true;
  menuOptions.signOutUsername = username;
  updateAppMenu();
};

exports.onFileDropped = function(filePath) {
  var markbotFilePath = path.resolve(filePath + '/' + MARKBOT_FILE);

  if (!exists.check(markbotFilePath)) {
    listener.send('app:file-missing');
    exports.disableFolderMenuFeatures();
    return;
  }

  currentFolderPath = filePath;

  menuOptions.runChecks = true;
  menuOptions.revealFolder = true;
  updateAppMenu();

  mainWindow.setRepresentedFilename(filePath);
  mainWindow.setTitle(filePath.split(/\//).pop() + ' — Markbot');

  markbotFile = yaml.safeLoad(fs.readFileSync(markbotFilePath, 'utf8'));
  listener.send('app:file-exists', markbotFile.repo);

  if (markbotFile.naming) {
    listener.send('check-group:new', 'naming', 'Naming conventions');
    naming.check(listener, filePath, 'naming');
  }

  if (markbotFile.commits) {
    listener.send('check-group:new', 'commits', 'Git commits');
    commits.check(listener, filePath, markbotFile.commits, config.ignoreCommitEmails, 'commits');
  }

  if (markbotFile.html) {
    markbotFile.html.forEach(function (file) {
      listener.send('check-group:new', file.path, file.path);
      html.check(listener, filePath, file, file.path);
    });
  }

  if (markbotFile.css) {
    markbotFile.css.forEach(function (file) {
      listener.send('check-group:new', file.path, file.path);
      css.check(listener, filePath, file, file.path);
    });
  }
};

exports.submitToCanvas = function (ghUsername, cb) {
  var getVars = [
    util.format('gh_repo=%s', encodeURI(markbotFile.repo)),
    util.format('gh_username=%s', encodeURI(ghUsername)),
    util.format('canvas_course=%s', markbotFile.canvasCourse),
    util.format('canvas_assignment=%s', markbotFile.canvasAssignment)
  ];

  https.get(util.format(config.proxyUrl, getVars.join('&')), function (res) {
    res.on('data', function (data) {
      cb(false);
    });
  }).on('error', function (e) {
    cb(true);
  });
};
