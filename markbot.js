'use strict';

const
  electron = require('electron'),
  app = electron.app,
  Menu = electron.Menu,
  BrowserWindow = electron.BrowserWindow,
  shell = electron.shell,
  fs = require('fs'),
  path = require('path'),
  util = require('util'),
  https = require('https'),
  yaml = require('js-yaml'),
  passcode = require('./lib/passcode'),
  locker = require('./lib/locker'),
  requirementsFinder = require('./lib/requirements-finder'),
  lockMatcher = require('./lib/lock-matcher'),
  exists = require('./lib/file-exists'),
  naming = require('./checks/naming-conventions'),
  commits = require('./checks/git-commits'),
  html = require('./checks/html'),
  css = require('./checks/css'),
  js = require('./checks/javascript'),
  screenshots = require('./checks/screenshots')
  ;

const MARKBOT_DEVELOP_MENU = !!process.env.MARKBOT_DEVELOP_MENU || false;
const MARKBOT_LOCK_PASSCODE = process.env.MARKBOT_LOCK_PASSCODE || false;
const appMenu = require('./lib/menu');
const MARKBOT_FILE = '.markbot.yml';
const MARKBOT_LOCK_FILE = '.markbot.lock';

let
  appPkg = require('./package.json'),
  config = require('./config.json'),
  markbotFile = {},
  mainWindow,
  differWindow,
  listener,
  menuCallbacks = {},
  menuOptions = {
    openRepo: false,
    runChecks: false,
    revealFolder: false,
    viewLocal: false,
    viewLive: false,
    signOut: false,
    signOutUsername: false,
    showDevelop: false,
    developMenuItems: false
  },
  markbotFilePath,
  markbotLockFilePath,
  currentFolderPath,
  markbotLockFileLocker,
  actualFilesLocker,
  isCheater = {
    cheated: false,
    matches: {}
  }
;

const updateAppMenu = function () {
  menuOptions.showDevelop = (MARKBOT_DEVELOP_MENU && MARKBOT_LOCK_PASSCODE && passcode.matches(MARKBOT_LOCK_PASSCODE, config.secret, config.passcodeHash));
  Menu.setApplicationMenu(Menu.buildFromTemplate(appMenu.getMenuTemplate(app, listener, menuCallbacks, menuOptions)));
};

const createWindow = function () {
  mainWindow = new BrowserWindow({
    width: 800,
    minWidth: 600,
    height: 600,
    minHeight: 550,
    titleBarStyle: 'hidden-inset'
  });

  mainWindow.loadURL('file://' + __dirname + '/frontend/index.html');

  mainWindow.on('closed', function () {
    if (differWindow) differWindow.destroy();
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

exports.disableFolderMenuFeatures = function () {
  menuOptions.runChecks = false;
  menuOptions.revealFolder = false;
  menuOptions.viewLocal = false;
  menuOptions.viewLive = false;
  menuOptions.ghIssues = false;
  updateAppMenu();
};
menuCallbacks.disableFolderMenuFeatures = exports.disableFolderMenuFeatures;

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

exports.diffScreenshots = function (genRefScreens) {
  markbotFile.screenshots.forEach(function (file) {
    screenshots.check(listener, currentFolderPath, file, 'screenshots', genRefScreens);
  });
};
menuCallbacks.diffScreenshots = exports.diffScreenshots;

exports.lockRequirements = function () {
  actualFilesLocker.save(markbotLockFilePath);
};
menuCallbacks.lockRequirements = exports.lockRequirements;

exports.onFileDropped = function(filePath) {
  markbotLockFileLocker = locker.new(config.passcodeHash);
  actualFilesLocker = locker.new(config.passcodeHash);

  markbotFilePath = path.resolve(filePath + '/' + MARKBOT_FILE);
  markbotLockFilePath = path.resolve(filePath + '/' + MARKBOT_LOCK_FILE);

  if (!exists.check(markbotFilePath)) {
    listener.send('app:file-missing');
    exports.disableFolderMenuFeatures();
    return;
  }

  menuOptions.runChecks = true;
  menuOptions.revealFolder = true;
  menuOptions.viewLocal = 'file://' + path.resolve(filePath + '/' + 'index.html');
  menuOptions.viewLive = `http://{{username}}.github.io/${markbotFile.repo}/`;
  menuOptions.ghIssues = `http://github.com/{{username}}/${markbotFile.repo}/issues`;
  menuOptions.developMenuItems = true;
  updateAppMenu();

  currentFolderPath = filePath;

  mainWindow.setRepresentedFilename(filePath);
  mainWindow.setTitle(filePath.split(/\//).pop() + ' — Markbot');

  markbotFile = yaml.safeLoad(fs.readFileSync(markbotFilePath, 'utf8'));
  markbotLockFileLocker.read(markbotLockFilePath);
  requirementsFinder.lock(actualFilesLocker, currentFolderPath, markbotFile);
  isCheater = lockMatcher.match(markbotLockFileLocker.getLocks(), actualFilesLocker.getLocks());

  listener.send('app:file-exists', markbotFile.repo);

  listener.send('check-group:new', 'markbot', 'Markbot file');
  listener.send('check-group:item-new', 'markbot', 'file', 'Exists');
  listener.send('check-group:item-complete', 'markbot', 'file', 'Exists');

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

      if (isCheater.matches[file.path]) {
        html.check(listener, filePath, file, file.path, isCheater.matches[file.path]);
      } else {
        html.check(listener, filePath, file, file.path);
      }
    });
  }

  if (markbotFile.css) {
    markbotFile.css.forEach(function (file) {
      listener.send('check-group:new', file.path, file.path);

      if (isCheater.matches[file.path]) {
        css.check(listener, filePath, file, file.path, isCheater.matches[file.path]);
      } else {
        css.check(listener, filePath, file, file.path);
      }
    });
  }

  if (markbotFile.js) {
    markbotFile.js.forEach(function (file) {
      listener.send('check-group:new', file.path, file.path);

      if (isCheater.matches[file.path]) {
        js.check(listener, filePath, file, file.path, isCheater.matches[file.path]);
      } else {
        js.check(listener, filePath, file, file.path);
      }
    });
  }

  if (markbotFile.screenshots) {
    listener.send('check-group:new', 'screenshots', 'Screenshots');
    exports.diffScreenshots();
  }
};

exports.showDifferWindow = function (imgs, width) {
  let js = `setImages('${imgs}')`;

  if (!differWindow) {
    differWindow = new BrowserWindow({
      width: 320,
      height: 400,
      minWidth: 320,
      maxHeight: 2000,
      show: false
    });

    differWindow.loadURL(`file://${__dirname}/frontend/differ.html`);

    differWindow.on('close', function (e) {
      e.preventDefault();
      differWindow.hide();
      e.returnValue = false;
    });

    differWindow.on('closed', function () {
      differWindow = null;
    });
  }

  differWindow.setSize(width, 400);
  differWindow.setMaximumSize(width, 2000);
  differWindow.webContents.executeJavaScript(js);
  differWindow.show();
};

exports.submitToCanvas = function (ghUsername, cb) {
  var getVars = [
    util.format('gh_repo=%s', encodeURI(markbotFile.repo)),
    util.format('gh_username=%s', encodeURI(ghUsername)),
    util.format('canvas_course=%s', markbotFile.canvasCourse),
    util.format('canvas_assignment=%s', markbotFile.canvasAssignment),
    util.format('markbot_version=%s', appPkg.version),
    util.format('cheater=%d', (isCheater.cheated) ? 1 : 0)
  ];

  https.get(util.format(config.proxyUrl, getVars.join('&')), function (res) {
    res.on('data', function (data) {
      cb(false, JSON.parse(data.toString('utf8')));
    });
  }).on('error', function (e) {
    cb(true);
  });
};
