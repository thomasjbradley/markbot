'use strict';

const path = require('path');
const exists = require('./file-exists');
const markbotMain = require('./markbot-main');
const screenshotNamingService = require('./checks/screenshots/naming-service');

let missingFiles = [];

const lockMarkbotFile = function (locker, markbotFile) {
  locker.lockString('markbot', JSON.stringify(markbotFile));
};

const lockFiles = function (locker, currentFolderPath, files) {
  files.forEach(function (file) {
    let filePath = path.resolve(currentFolderPath + '/' + file.path);

    if (!file.locked) return;

    if (!exists.check(filePath)) {
      missingFiles.push(file.path);
      return;
    }

    if (file.locked) locker.lockFile(file.path, filePath);
  });
};

const lockScreenshots = function ( locker, currentFolderPath, files) {
  files.forEach(function (file) {
    file.sizes.forEach(function (size) {
      let screenshotFileName = screenshotNamingService.getScreenshotFileName(file.path, size);
      let screenshotPath = path.resolve(currentFolderPath + '/' + screenshotNamingService.REFERENCE_SCREENSHOT_FOLDER + '/' + screenshotFileName);

      if (!exists.check(screenshotPath)) {
        missingFiles.push(screenshotFileName);
        return;
      }

      locker.lockFile(screenshotFileName, screenshotPath);
    });
  });
};

const lock = function ( locker, currentFolderPath, markbotFile) {
  missingFiles = [];
  locker.reset();

  lockMarkbotFile(locker, markbotFile);

  if (markbotFile.html) lockFiles(locker, currentFolderPath, markbotFile.html);
  if (markbotFile.css) lockFiles(locker, currentFolderPath, markbotFile.css);
  if (markbotFile.js) lockFiles(locker, currentFolderPath, markbotFile.js);
  if (markbotFile.screenshots) lockScreenshots(locker, currentFolderPath, markbotFile.screenshots);

  if (missingFiles.length > 0) {
    markbotMain.send('alert', `The following files could not be locked because they’re missing:\n• ${missingFiles.join('\n• ')}`);
  }
};

module.exports = {
  lock: lock
};
