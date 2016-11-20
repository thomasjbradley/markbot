'use strict';

const electron = require('electron');
const dialog = electron.dialog;
const shell = electron.shell;
const pkg = require('../package');
const markbotMain = require('./markbot-main');

module.exports.getMenuTemplate = function (app, cbs, opts) {
  var template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Repository…',
          enabled: (opts && opts.openRepo) ? true : false,
          accelerator: 'CmdOrCtrl+O',
          click: function (item, focusedWindow) {
            dialog.showOpenDialog({ title: 'Open Repository…', properties: ['openDirectory']}, function (paths) {
              if (paths && paths.length > 0) {
                markbotMain.send('app:open-repo', paths[0]);
              } else {
                markbotMain.send('app:file-missing');
              }
            });
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Run Checks',
          enabled: (opts && opts.runChecks) ? true : false,
          accelerator: 'CmdOrCtrl+R',
          click: function (item, focusedWindow) {
            markbotMain.send('app:re-run');
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Reveal Folder',
          enabled: (opts && opts.revealFolder) ? true : false,
          accelerator: 'CmdOrCtrl+Shift+R',
          click: function (item, focusedWindow) {
            cbs.revealFolder();
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Preview Website Locally',
          enabled: (opts && opts.viewLocal) ? true : false,
          click: function (item, focusedWindow) {
            shell.openExternal('https://localhost:8080/');
          }
        },
        {
          label: 'View Live Website',
          enabled: (opts && opts.viewLive) ? true : false,
          click: function (item, focusedWindow) {
            shell.openExternal(opts.viewLive.replace(/\{\{username\}\}/, opts.signOutUsername));
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
        {
          type: 'separator'
        },
        {
          label: 'Activity',
          accelerator: 'CmdOrCtrl+Alt+0',
          click: function() {
            cbs.showDebugWindow();
          }
        }
      ]
    },
    {
      label: 'Help',
      role: 'help',
      submenu: [
        {
          label: 'Get Assignment Help on GitHub',
          enabled: (opts && opts.signOutUsername && opts.ghIssues) ? true : false,
          click: function () {
            shell.openExternal(opts.ghIssues.replace(/\{\{username\}\}/, opts.signOutUsername));
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Markbot License',
          click: function () {
            shell.openExternal('https://github.com/thomasjbradley/markbot/blob/master/LICENSE');
          }
        },
        {
          label: 'Markbot Website',
          click: function () {
            shell.openExternal('https://github.com/thomasjbradley/markbot/');
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Markbot Support',
          click: function () {
            shell.openExternal('https://github.com/thomasjbradley/markbot/issues/');
          }
        },
        {
          label: 'Send Feedback…',
          click: function () {
            shell.openExternal('mailto:bradlet@algonquincollege.com');
          }
        },
      ]
    }
  ];

  if (process.platform == 'darwin') {
    // MacOS application menu
    template.unshift({
      label: 'Markbot',
      submenu: [
        {
          label: `Version ${pkg.version}`,
          enabled: false
        },
        {
          type: 'separator'
        },
        {
          label: (opts && opts.signOutUsername) ? 'Sign Out (' + opts.signOutUsername + ')' : 'Sign Out',
          enabled: (opts && opts.signOut) ? true : false,
          click:  function(item, focusedWindow) {
            markbotMain.send('app:sign-out');
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

    // Window menu
    template[2].submenu.push(
      {
        type: 'separator'
      },
      {
        label: 'Bring All to Front',
        role: 'front'
      }
    );
  }

  if (process.platform == 'win32') {
    // File menu
    template[0].submenu.push(
      {
        type: 'separator'
      },
      {
        label: (opts && opts.signOutUsername) ? 'Sign Out (' + opts.signOutUsername + ')' : 'Sign Out',
        enabled: (opts && opts.signOut) ? true : false,
        click:  function(item, focusedWindow) {
          markbotMain.send('app:sign-out');
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Quit',
        accelerator: 'Ctrl+Q',
        click: function() { app.quit(); }
      }
    );

    // Help menu
    template[2].submenu.push(
      {
        type: 'separator'
      },
      {
        label: `Version ${pkg.version}`,
        enabled: false
      }
    );
  }

  if (opts && opts.showDevelop) {
    template.splice(template.length - 2, 0, {
      label: 'Develop',
      submenu: [
        {
          label: 'Show Inspector',
          accelerator: (function() {
            if (process.platform == 'darwin') {
              return 'Alt+Command+I';
            } else {
              return 'Ctrl+Shift+I';
            }
          })(),
          click: function(item, focusedWindow) {
            focusedWindow.toggleDevTools();
          }
        },
        {
          label: 'Force Reload',
          accelerator: 'CmdOrCtrl+Alt+R',
          click: function(item, focusedWindow) {
            cbs.disableFolderMenuFeatures();
            focusedWindow.reload();
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Generate Reference Screenshots',
          enabled: (opts && opts.developMenuItems) ? true : false,
          accelerator: 'Shift+CmdOrCtrl+S',
          click: function(item, focusedWindow) {
            cbs.copyReferenceScreenshots();
          }
        },
        {
          label: 'Lock Requirements',
          enabled: (opts && opts.developMenuItems) ? true : false,
          accelerator: 'CmdOrCtrl+L',
          click: function(item, focusedWindow) {
            cbs.lockRequirements();
          }
        },
      ]
    });
  }

  return template;
};
