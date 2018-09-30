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
                cbs.openRepo(paths[0]);
              } else {
                cbs.fileMissing();
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
          label: 'Edit Code',
          enabled: (opts && opts.revealFolder) ? true : false,
          accelerator: 'CmdOrCtrl+E',
          click: function (item, focusedWindow) {
            cbs.openInCodeEditor();
          }
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
          label: 'Browse Local Website',
          enabled: (opts && opts.viewLocal) ? true : false,
          accelerator: 'CmdOrCtrl+B',
          click: function (item, focusedWindow) {
            cbs.openBrowserToServer();
          }
        },
        {
          label: 'Browse Live Website',
          enabled: (opts && opts.viewLive) ? true : false,
          accelerator: 'CmdOrCtrl+Shift+B',
          click: function (item, focusedWindow) {
            shell.openExternal(opts.viewLive.replace(/\{\{username\}\}/, opts.signOutUsername));
          }
        },
        {
          label: 'Browse GitHub Repo',
          enabled: (opts && opts.browseRepo) ? true : false,
          accelerator: 'CmdOrCtrl+G',
          click: function (item, focusedWindow) {
            cbs.openGitHubRepo();
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'View Your Progress',
          enabled: (opts && opts.openProgressinator) ? true : false,
          accelerator: 'CmdOrCtrl+P',
          click: function (item, focusedWindow) {
            cbs.openProgressinator();
          }
        },
        {
          label: 'Submit Assignment',
          enabled: (opts && opts.submitAssignment) ? true : false,
          accelerator: 'CmdOrCtrl+S',
          click: function (item, focusedWindow) {
            cbs.submitAssignment();
          }
        },
      ]
    },
    {
      label: 'Edit',
      submenu: [
        {role: 'cut'},
        {role: 'copy'},
        {role: 'paste'},
        {role: 'delete'},
        {role: 'selectall'},
      ],
    },
    {
      label: 'Window',
      role: 'window',
      submenu: [
        {
          role: 'minimize'
        },
        {
          role: 'close'
        },
        {
          type: 'separator'
        },
        {
          label: 'Focus Toolbar',
          enabled: (opts && opts.revealFolder) ? true : false,
          accelerator: 'CmdOrCtrl+1',
          click: function (item, focusedWindow) {
            cbs.focusToolbar();
          }
        },
        {
          label: 'Focus Check List',
          enabled: (opts && opts.revealFolder) ? true : false,
          accelerator: 'CmdOrCtrl+2',
          click: function (item, focusedWindow) {
            cbs.focusCheckList();
          }
        },
        {
          label: 'Focus Error List',
          enabled: (opts && opts.revealFolder) ? true : false,
          accelerator: 'CmdOrCtrl+3',
          click: function (item, focusedWindow) {
            cbs.focusErrorList();
          }
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
            cbs.createGitHubIssue();
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
          role: 'hide'
        },
        {
          role: 'hideothers'
        },
        {
          role: 'unhide'
        },
        {
          type: 'separator'
        },
        {
          role: 'quit',
        },
      ]
    });

    // Window menu
    template[3].submenu.push(
      {
        type: 'separator'
      },
      {
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
        role: 'quit'
      }
    );

    // Help menu
    template[3].submenu.push(
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
            if (focusedWindow) focusedWindow.toggleDevTools();
          }
        },
        {
          label: 'Force Reload',
          accelerator: 'CmdOrCtrl+Alt+R',
          click: function(item, focusedWindow) {
            cbs.disableFolderMenuFeatures();

            if (focusedWindow) {
              focusedWindow.reload();
              focusedWindow.webContents.once('did-finish-load', () => {
                focusedWindow.webContents.send('app:ready');
              });
            }
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
        {
          type: 'separator'
        },
        {
          label: 'Debugging Mode',
          type: 'checkbox',
          checked: (opts && opts.debugChecked) ? true : false,
          click: function () {
            cbs.toggleDebug();
          }
        }
      ]
    });
  }

  return template;
};
