'use strict';

const electron = require('electron');
const app = electron.app;
const Menu = electron.Menu;
const dialog = electron.dialog;
const BrowserWindow = electron.BrowserWindow;

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
  listener
;

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

  Menu.setApplicationMenu(Menu.buildFromTemplate(getMenuTemplate()));
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});

exports.onFileDropped = function(filePath) {
  var markbotFilePath = path.resolve(filePath + '/' + MARKBOT_FILE);

  if (!exists.check(markbotFilePath)) {
    listener.send('app:file-missing');
    return;
  }

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

const getMenuTemplate = function () {
  var template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Repository…',
          accelerator: 'CmdOrCtrl+O',
          click: function (item, focusedWindow) {
            dialog.showOpenDialog({ title: 'Open Repository…', properties: ['openDirectory']}, function (paths) {
              if (paths && paths.length > 0) {
                listener.send('app:open-repo', paths[0]);
              } else {
                listener.send('app:file-missing');
              }
            });
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Run Checks',
          accelerator: 'CmdOrCtrl+R',
          click: function (item, focusedWindow) {
            listener.send('app:re-run');
          }
        },
      ]
    },
    {
      label: 'Window',
      role: 'window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'CmdOrCtrl+M',
          role: 'minimize'
        },
        {
          label: 'Close',
          accelerator: 'CmdOrCtrl+W',
          role: 'close'
        },
      ]
    },
  ];

  if (process.platform == 'darwin') {
    template.unshift({
      label: 'Markbot',
      submenu: [
        {
          label: 'About Markbot',
          role: 'about'
        },
        {
          type: 'separator'
        },
        {
          label: 'Sign Out',
          click:  function(item, focusedWindow) {
            listener.send('app:sign-out');
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Force Reload',
          accelerator: 'CmdOrCtrl+Alt+R',
          click: function(item, focusedWindow) {
            listener.send('app:force-reload');
          }
        },
        {
          label: 'Debug',
          accelerator: (function() {
            if (process.platform == 'darwin') {
              return 'Alt+Command+I';
            } else {
              return 'Ctrl+Shift+I';
            }
          })(),
          click: function(item, focusedWindow) {
            mainWindow.toggleDevTools();
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Hide Markbot',
          accelerator: 'Command+H',
          role: 'hide'
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Alt+H',
          role: 'hideothers'
        },
        {
          label: 'Show All',
          role: 'unhide'
        },
        {
          type: 'separator'
        },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: function() { app.quit(); }
        },
      ]
    });
    // Window menu.
    template[2].submenu.push(
      {
        type: 'separator'
      },
      {
        label: 'Bring All to Front',
        role: 'front'
      }
    );
  };

  return template;
};
