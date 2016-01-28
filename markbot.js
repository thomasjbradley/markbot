'use strict';

const electron = require('electron');
const app = electron.app;
const Menu = electron.Menu;
const dialog = electron.dialog;
const BrowserWindow = electron.BrowserWindow;

const MARKBOT_FILE = '.markbot.yml';

var
  fs = require('fs'),
  util = require('util'),
  https = require('https'),
  yaml = require('js-yaml'),
  config = require('./config.json'),
  markbotFile = {},
  exists = require('./checks/file-exists'),
  naming = require('./checks/naming-conventions'),
  commits = require('./checks/git-commits'),
  html = require('./checks/html'),
  css = require('./checks/css')
;

let mainWindow;

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

  Menu.setApplicationMenu(Menu.buildFromTemplate(getMenuTemplate()));
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});

exports.onFileDropped = function(path, groupCallback, checkCallback, repoCallback) {
  var markbotFilePath = path + '/' + MARKBOT_FILE;

  if (!exists.check(markbotFilePath)) {
    repoCallback(true, null);
    return;
  }

  mainWindow.setRepresentedFilename(path);
  mainWindow.setTitle(path.split(/\//).pop() + ' — Markbot');

  markbotFile = yaml.safeLoad(fs.readFileSync(markbotFilePath, 'utf8'));
  repoCallback(false, markbotFile.repo);

  if (markbotFile.naming) {
    groupCallback('naming', 'Naming conventions', function () {
      naming.check(path, 'naming', checkCallback);
    });
  }

  if (markbotFile.commits) {
    groupCallback('commits', 'Git commits', function () {
      commits.check(path, markbotFile.commits, config.ignoreCommitEmails, 'commits', checkCallback);
    });
  }

  if (markbotFile.html) {
    markbotFile.html.forEach(function (file) {
      groupCallback(file.path, file.path, function () {
        html.check(path, file, file.path, checkCallback);
      });
    });
  }

  if (markbotFile.css) {
    markbotFile.css.forEach(function (file) {
      groupCallback(file.path, file.path, function () {
        css.check(path, file, file.path, checkCallback);
      });
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
                mainWindow.webContents.send('open-repo', paths[0]);
              } else {
                mainWindow.webContents.send('open-repo', false);
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
            mainWindow.webContents.send('re-run');
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
            mainWindow.webContents.send('sign-out');
            mainWindow.reload();
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Force Reload',
          accelerator: 'CmdOrCtrl+Alt+R',
          click: function(item, focusedWindow) {
            mainWindow.reload();
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
