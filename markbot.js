'use strict';

const electron = require('electron');
const app = electron.app;
const Menu = electron.Menu;
const BrowserWindow = electron.BrowserWindow;
const shell = electron.shell;
const exec = require('child_process').exec;
const fs = require('fs');
const path = require('path');
const util = require('util');
const https = require('https');
const crypto = require('crypto');
const mkdirp = require('mkdirp');
const fixPath = require('fix-path');

const markbotMain = require('./app/markbot-main');
const markbotFileGenerator = require('./app/markbot-file-generator');
const dependencyChecker = require('./app/dependency-checker');
const serverManager = require('./app/server-manager');
const screenshotNamingService = require('./app/checks/screenshots/naming-service');
const passcode = require('./app/passcode');
const locker = require('./app/locker');
const requirementsFinder = require('./app/requirements-finder');
const lockMatcher = require('./app/lock-matcher');
const exists = require('./app/file-exists');
const escapeShell = require(`./app/escape-shell`);
const checkManager = require('./app/check-manager');

global.ENV = process.env.NODE_ENV;
global.DEBUG = (global.ENV === 'development');

const MARKBOT_DEVELOP_MENU = !!process.env.MARKBOT_DEVELOP_MENU || false;
const MARKBOT_LOCK_PASSCODE = process.env.MARKBOT_LOCK_PASSCODE || false;
const appMenu = require('./app/menu');
const MARKBOT_FILE = '.markbot.yml';
const MARKBOT_LOCK_FILE = '.markbot.lock';

let appPkg = require('./package.json');
let config = require('./config.json');
let dependencies = {};
let markbotFile = {};
let markbotFileOriginal = {};
let markbotIgnoreFile = {};
let mainWindow;
let debugWindow;
let differWindow;
let menuCallbacks = {};
let menuOptions = {
  openRepo: false,
  runChecks: false,
  revealFolder: false,
  viewLocal: false,
  viewLive: false,
  browseRepo: false,
  submitAssignment: false,
  signOut: false,
  signOutUsername: false,
  showDevelop: false,
  developMenuItems: false,
  debugChecked: global.DEBUG,
};
let markbotFilePath;
let markbotLockFilePath;
let currentFolderPath;
let markbotLockFileLocker;
let actualFilesLocker;
let isCheater = {
  cheated: false,
  matches: {},
};

app.commandLine.appendSwitch('--ignore-certificate-errors');
app.commandLine.appendSwitch('--disable-http-cache');

const updateAppMenu = function () {
  menuOptions.showDevelop = (MARKBOT_DEVELOP_MENU && MARKBOT_LOCK_PASSCODE && passcode.matches(MARKBOT_LOCK_PASSCODE, config.secret, config.passcodeHash));
  Menu.setApplicationMenu(Menu.buildFromTemplate(appMenu.getMenuTemplate(app, menuCallbacks, menuOptions)));
};

const createMainWindow = function (next) {
  mainWindow = new BrowserWindow({
    width: 800,
    minWidth: 800,
    height: 600,
    show: false,
    minHeight: 550,
    titleBarStyle: 'hidden-inset',
    vibrancy: 'light',
  });

  mainWindow.loadURL('file://' + __dirname + '/frontend/main/main.html');

  mainWindow.on('closed', function () {
    if (differWindow) differWindow.destroy();
    if (debugWindow) debugWindow.destroy();

    checkManager.stop();
    exports.disableFolderMenuFeatures();

    mainWindow.destroy();
    mainWindow = null;
  });

  mainWindow.once('ready-to-show', function () {
    mainWindow.show();

    if (next) next();
  });

  mainWindow.on('focus', function () {
    mainWindow.webContents.send('app:focus');
  });

  mainWindow.on('blur', function () {
    mainWindow.webContents.send('app:blur');
  });

  global.markbotMainWindow = mainWindow.id;
  if (global.DEBUG) console.log(`Main window: ${mainWindow.id}`);
};

const createDebugWindow = function () {
  debugWindow = new BrowserWindow({
    width: 600,
    minWidth: 600,
    height: 300,
    minHeight: 300,
    show: false
  });

  debugWindow.on('close', function (e) {
    e.preventDefault();
    debugWindow.hide();
  })

  debugWindow.loadURL('file://' + __dirname + '/frontend/debug/debug.html');
  global.markbotDebugWindow = debugWindow.id;
};

const createWindows = function (next) {
  createMainWindow(next);
  createDebugWindow();
};

const initializeInterface = function () {
  let repoOrFolder = (markbotFile.repo) ? markbotFile.repo : currentFolderPath.split(/[\\\/]/).pop();

  mainWindow.setRepresentedFilename(currentFolderPath);
  mainWindow.setTitle(repoOrFolder + ' — Markbot');

  menuOptions.runChecks = true;
  menuOptions.revealFolder = true;
  menuOptions.viewLocal = true;
  menuOptions.developMenuItems = true;

  if (markbotFile.canvasCourse) markbotMain.send('app:with-canvas');

  if (markbotFile.repo) {
    menuOptions.viewLive = `https://{{username}}.github.io/${repoOrFolder}/`;
    menuOptions.ghRepo = `https://github.com/{{username}}/${repoOrFolder}`;
    menuOptions.ghIssues = `https://github.com/{{username}}/${repoOrFolder}/issues/new`;
    menuOptions.browseRepo = true;
    markbotMain.send('app:with-github');
  } else {
    menuOptions.viewLive = false;
    menuOptions.ghRepo = false;
    menuOptions.ghIssues = false;
    menuOptions.browseRepo = false;
    markbotMain.send('app:without-github');
  }
};

const checkForCheating = function () {
  markbotLockFileLocker = locker.new(config.passcodeHash);
  actualFilesLocker = locker.new(config.passcodeHash);

  markbotLockFileLocker.read(markbotLockFilePath);
  requirementsFinder.lock(actualFilesLocker, currentFolderPath, markbotFile, markbotFileOriginal, markbotIgnoreFile);
  isCheater = lockMatcher.match(markbotLockFileLocker.getLocks(), actualFilesLocker.getLocks(), markbotIgnoreFile);

  if (isCheater.cheated) {
    markbotMain.debug('CHEATER!');

    for (let match in isCheater.matches) {
      if (!isCheater.matches[match].equal) {
        if (isCheater.matches[match].actualHash && isCheater.matches[match].expectedHash) {
          markbotMain.debug(`&nbsp;&nbsp;┖ \`${match}\` is different — expecting: \`${isCheater.matches[match].expectedHash.slice(0, 7)}…\` actual: \`${isCheater.matches[match].actualHash.slice(0, 7)}…\``);
        } else {
          markbotMain.debug(`&nbsp;&nbsp;┖ \`${match}\` is different`);
        }
      }
    }
  }
};

const hasFilesToCheck = function () {
  const noHtmlFiles = (typeof markbotFile.html === 'undefined' || markbotFile.html.length < 1);
  const noCssFiles = (typeof markbotFile.css === 'undefined' || markbotFile.css.length < 1);
  const noJsFiles = (typeof markbotFile.js === 'undefined' || markbotFile.js.length < 1);
  const noMdFiles = (typeof markbotFile.md === 'undefined' || markbotFile.md.length < 1);
  const noYmlFiles = (typeof markbotFile.yml === 'undefined' || markbotFile.yml.length < 1);

  if (noHtmlFiles && noCssFiles && noJsFiles && noMdFiles && noYmlFiles) {
    markbotMain.send('app:file-missing');

    setTimeout(function () {
      markbotMain.send('alert', 'There are no HTML, CSS, Javascript, Markdown, or YAML files for Markbot to check');
    }, 75);

    return false;
  }

  return true;
};

const startChecks = function () {
  let markbotGroup = `markbot-${Date.now()}`;
  let repoOrFolder = (markbotFile.repo) ? markbotFile.repo : currentFolderPath.split(/[\\\/]/).pop();

  markbotFile.cwd = currentFolderPath;
  markbotFile.username = menuOptions.signOutUsername;

  markbotMain.send('app:file-exists', repoOrFolder);

  markbotMain.send('check-group:new', markbotGroup, 'Markbot file');

  if (markbotFile.internalTemplate) {
    markbotMain.send('check-group:item-new', markbotGroup, 'file', 'Not found');
    markbotMain.send('check-group:item-complete', markbotGroup, 'file', 'Not found');
    markbotMain.send('check-group:item-new', markbotGroup, 'settings', 'Using default settings');
    markbotMain.send('check-group:item-complete', markbotGroup, 'settings', 'Using default settings');
  } else {
    markbotMain.send('check-group:item-new', markbotGroup, 'file', 'Exists');
    markbotMain.send('check-group:item-complete', markbotGroup, 'file', 'Exists');
  }

  checkManager.run(markbotFile, isCheater, function () {
    markbotMain.send('app:all-done');
  });
};

const handleMarkbotFile = function (mf, ignores, mfOriginal) {
  markbotFile = mf;
  markbotFileOriginal = mfOriginal;
  markbotIgnoreFile = ignores;

  if (mf.inheritFilesNotFound && mf.inheritFilesNotFound.length > 0) markbotMain.debug(`Inherited Markbot file(s) “${mf.inheritFilesNotFound.join(', ')}” not found`);

  if (global.DEBUG) console.log(mf);
  markbotMain.debug(`Server “web”: @@${serverManager.getHost('web')}@@`);
  markbotMain.debug(`Server “html”: @@${serverManager.getHost('html')}@@`);
  markbotMain.debug(`Server “language”: @@${serverManager.getHost('language')}@@`);

  initializeInterface();
  updateAppMenu();
  checkForCheating();

  if (hasFilesToCheck()) startChecks();
};

menuCallbacks.showDebugWindow = function () {
  debugWindow.show();
};

app.on('ready', function () {
  fixPath();
  updateAppMenu();

  createWindows(() => {
    dependencyChecker.check((deps) => {
      dependencies = deps;

      if (deps.hasMissingDependencies) return mainWindow.webContents.send('error:missing-dependency', deps);

      serverManager.start(() => {
        mainWindow.webContents.send('app:ready');
      });
    });
  });
});

const shouldQuit = app.makeSingleInstance((commandLine, workingDirectory) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
});
if (shouldQuit) app.quit();

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  serverManager.stop();
  app.releaseSingleInstance();
});

exports.relaunch = function () {
  app.relaunch();
  app.quit();
};

app.on('activate', function () {
  if (mainWindow === null) {
    createWindows(() => {
      if (dependencies.hasMissingDependencies) return markbotMain.send('error:missing-dependency', dependencies);

      markbotMain.send('app:ready');
    });
  }
});

exports.openRepo = function (path) {
  if (typeof path !== 'string') path = path[0];

  if (mainWindow === null) {
    createWindows(function () {
      if (dependencies.hasMissingDependencies) return markbotMain.send('error:missing-dependency', dependencies);

      markbotMain.send('app:ready');
      markbotMain.send('app:file-dropped', path);
    });
  } else {
    markbotMain.send('app:file-dropped', path);
  }
};
menuCallbacks.openRepo = exports.openRepo;

exports.fileMissing = function (path) {
  if (mainWindow === null) {
    createWindows(function () {
      markbotMain.send('app:file-missing');
    });
  } else {
    markbotMain.send('app:file-missing');
  }
};
menuCallbacks.fileMissing = exports.fileMissing;

app.on('open-file', function (e, path) {
  e.preventDefault();
  exports.openRepo(path);
});

exports.newDebugGroup = function (label) {
  debugWindow.webContents.send('__markbot-debug-group', label);
};

exports.debug = function (args) {
  debugWindow.webContents.send('__markbot-debug', ...args);
};

exports.revealFolder = function () {
  if (currentFolderPath) {
    shell.showItemInFolder(currentFolderPath);
  }
};
menuCallbacks.revealFolder = exports.revealFolder;

exports.openBrowserToServer = function () {
  shell.openExternal(serverManager.getHost('web'));
};
menuCallbacks.openBrowserToServer = exports.openBrowserToServer;

exports.createGitHubIssue = function () {
  shell.openExternal(menuOptions.ghIssues.replace(/\{\{username\}\}/, menuOptions.signOutUsername));
};
menuCallbacks.createGitHubIssue = exports.createGitHubIssue;

exports.openGitHubRepo = function () {
  shell.openExternal(menuOptions.ghRepo.replace(/\{\{username\}\}/, menuOptions.signOutUsername));
};
menuCallbacks.openGitHubRepo = exports.openGitHubRepo;

exports.submitAssignment = function () {
  markbotMain.send('app:submit-assignment');
};
menuCallbacks.submitAssignment = exports.submitAssignment;

exports.enableSubmitAssignment = function () {
  menuOptions.submitAssignment = true;
  updateAppMenu();
};

exports.disableSubmitAssignment = function () {
  menuOptions.submitAssignment = false;
  updateAppMenu();
};

exports.openInCodeEditor = function () {
  if (currentFolderPath) {
    exec(`open -b com.github.atom ${escapeShell(currentFolderPath)}`);
  }
};
menuCallbacks.openInCodeEditor = exports.openInCodeEditor;

exports.disableFolderMenuFeatures = function () {
  menuOptions.runChecks = false;
  menuOptions.revealFolder = false;
  menuOptions.viewLocal = false;
  menuOptions.viewLive = false;
  menuOptions.browseRepo = false;
  menuOptions.ghRepo = false;
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

exports.copyReferenceScreenshots = function () {
  markbotFile.screenshots.forEach(function (file) {
    if (!file.sizes) return;

    mkdirp.sync(path.resolve(currentFolderPath + '/' + screenshotNamingService.REFERENCE_SCREENSHOT_FOLDER));

    file.sizes.forEach(function (width) {
      fs.rename(
        screenshotNamingService.getScreenshotPath(currentFolderPath, screenshotNamingService.makeScreenshotBasename(file), width),
        screenshotNamingService.getScreenshotPath(currentFolderPath, screenshotNamingService.makeScreenshotBasename(file), width, true)
      );
    });
  });
};
menuCallbacks.copyReferenceScreenshots = exports.copyReferenceScreenshots;

exports.lockRequirements = function () {
  actualFilesLocker.save(markbotLockFilePath);
};
menuCallbacks.lockRequirements = exports.lockRequirements;

exports.onFileDropped = function(filePath) {
  markbotFilePath = path.resolve(filePath + '/' + MARKBOT_FILE);
  markbotLockFilePath = path.resolve(filePath + '/' + MARKBOT_LOCK_FILE);
  currentFolderPath = filePath;

  serverManager.getServer('web').setRoot(currentFolderPath);

  if (exists.check(markbotFilePath)) {
    markbotFileGenerator.get(markbotFilePath, handleMarkbotFile);
  } else {
    markbotFileGenerator.buildFromFolder(filePath, handleMarkbotFile);
  }

  if (differWindow) differWindow.hide();
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

    differWindow.loadURL(`file://${__dirname}/frontend/differ/differ.html`);

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
  differWindow.setSize(width, 400);
  global.markbotDifferWindow = differWindow.id;
};

exports.toggleDebug = function () {
  let ignoreWindows = [global.markbotMainWindow, global.markbotDebugWindow];

  global.DEBUG = !global.DEBUG;
  menuOptions.debugChecked = global.DEBUG;

  if (differWindow) ignoreWindows.push(global.markbotDifferWindow);

  if (global.DEBUG) {
    BrowserWindow.getAllWindows().forEach(function (win) {
      if (ignoreWindows.indexOf(win.id) === -1) {
        win.webContents.openDevTools({ mode: 'detach' });
        win.show();
      }
    });
  } else {
    BrowserWindow.getAllWindows().forEach(function (win) {
      if (ignoreWindows.indexOf(win.id) > -1) return;

      win.hide();
      win.webContents.closeDevTools();
      mainWindow.focus();
    });
  }
};
menuCallbacks.toggleDebug = exports.toggleDebug;

exports.focusToolbar = function () {
  mainWindow.focus();
  markbotMain.send('app:focus-toolbar');
};
menuCallbacks.focusToolbar = exports.focusToolbar;

exports.focusCheckList = function () {
  mainWindow.focus();
  markbotMain.send('app:focus-checklist');
};
menuCallbacks.focusCheckList = exports.focusCheckList;

exports.focusErrorList = function () {
  mainWindow.focus();
  markbotMain.send('app:focus-errorlist');
};
menuCallbacks.focusErrorList = exports.focusErrorList;

exports.submitToCanvas = function (ghUsername, next) {
  let getVars = [
    util.format('gh_repo=%s', encodeURI(markbotFile.repo)),
    util.format('gh_username=%s', encodeURI(ghUsername)),
    util.format('canvas_course=%s', markbotFile.canvasCourse),
    util.format('markbot_version=%s', appPkg.version),
    util.format('cheater=%d', (isCheater.cheated) ? 1 : 0)
  ];
  let hash = crypto.createHash('sha512');
  let sig = hash.update(getVars.join('&') + config.passcodeHash, 'utf8').digest('hex');

  getVars.push(`sig=${sig}`);
  markbotMain.debug(getVars.join('&'));

  https.get(util.format(config.proxyUrl, getVars.join('&')), function (res) {
    res.on('data', function (data) {
      next(false, JSON.parse(data.toString('utf8')));
    });
  }).on('error', function (e) {
    next(true);
  });
};
