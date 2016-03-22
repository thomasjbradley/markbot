'use strict';

const
  path = require('path'),
  screenshots = require('../checks/screenshots')
  ;

const lockMarkbotFile = function (locker, markbotFile) {
  locker.lockString('markbot', JSON.stringify(markbotFile));
};

const lockFiles = function (locker, currentFolderPath, files) {
  files.forEach(function (file) {
    let filePath = path.resolve(currentFolderPath + '/' + file.path);
    if (file.locked) locker.lockFile(file.path, filePath);
  });
};

const lockScreenshots = function (locker, currentFolderPath, files) {
  files.forEach(function (file) {
    file.sizes.forEach(function (size) {
      let
        screenshotFileName = screenshots.getScreenshotFileName(file.path, size),
        screenshotPath = path.resolve(currentFolderPath + '/' + screenshots.REFERENCE_SCREENSHOT_FOLDER + '/' + screenshotFileName)
        ;

      locker.lockFile(screenshotFileName, screenshotPath);
    });
  });
};

const lock = function (locker, currentFolderPath, markbotFile) {
  locker.reset();

  lockMarkbotFile(locker, markbotFile);

  if (markbotFile.html) lockFiles(locker, currentFolderPath, markbotFile.html);
  if (markbotFile.css) lockFiles(locker, currentFolderPath, markbotFile.css);
  if (markbotFile.js) lockFiles(locker, currentFolderPath, markbotFile.js);
  if (markbotFile.screenshots) lockScreenshots(locker, currentFolderPath, markbotFile.screenshots);
};

module.exports = {
  lock: lock
};
