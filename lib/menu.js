'use strict';

const
  electron = require('electron'),
  dialog = electron.dialog,
  pkg = require('../package')
;

module.exports.getMenuTemplate = function (app, listener, cbs, opts) {
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
          enabled: (opts && opts.runChecks) ? true : false,
          accelerator: 'CmdOrCtrl+R',
          click: function (item, focusedWindow) {
            listener.send('app:re-run');
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
          label: 'Save Template Markbot File',
          enabled: false,
          accelerator: 'CmdOrCtrl+G',
          click: function (item, focusedWindow) {
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
            listener.send('app:sign-out');
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
  }

  if (process.platform == 'win32') {
    template[0].submenu.push(
      {
        type: 'separator'
      },
      {
        label: (opts && opts.signOutUsername) ? 'Sign Out (' + opts.signOutUsername + ')' : 'Sign Out',
        enabled: (opts && opts.signOut) ? true : false,
        click:  function(item, focusedWindow) {
          listener.send('app:sign-out');
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

    template.push({
      label: 'Help',
      submenu: [
        {
          label: `Version ${pkg.version}`,
          enabled: false
        }
      ]
    });
  }

  if (opts && opts.showDevelop) {
    template.splice(template.length - 1, 0, {
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
          accelerator: 'Shift+CmdOrCtrl+S',
          click: function(item, focusedWindow) {
            const GENERATE_REFERENCE_SCREENSHOTS = true;
            cbs.diffScreenshots(GENERATE_REFERENCE_SCREENSHOTS);
          }
        },
        {
          label: 'Generate File Locks',
          accelerator: 'Shift+CmdOrCtrl+L',
          enabled: false,
          click: function(item, focusedWindow) {
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Lock Requirements',
          accelerator: 'CmdOrCtrl+L',
          enabled: false,
          click: function(item, focusedWindow) {
          }
        },
      ]
    });
  }

  return template;
};
