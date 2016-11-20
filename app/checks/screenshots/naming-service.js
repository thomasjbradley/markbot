'use strict';

const path = require('path');
const is = require('electron-is');
const classify = require('../../classify');

const SCREENSHOT_PREFIX = 'markbot';
const REFERENCE_SCREENSHOT_FOLDER = 'screenshots';

let app;

if (is.renderer()) {
  app = require('electron').remote.app;
} else {
  app = require('electron').app;
}

const formatScreenshotFileName = function (filename, width, prefix) {
  let pre = (prefix) ? `${prefix}-` : '';

  return `${pre}${classify(filename.replace(/\.html$/, ''))}-${width}.png`;
};

const getImagePath = function (projectPath, filename, width, genRefScreens) {
  let formattedFilename, imgPath, fullPath;

  if (genRefScreens) {
    formattedFilename = formatScreenshotFileName(filename, width);
    imgPath = path.resolve(path.resolve(projectPath) + '/' + REFERENCE_SCREENSHOT_FOLDER);
    fullPath = path.resolve(imgPath + '/' + formattedFilename);
  } else {
    formattedFilename = formatScreenshotFileName(filename, width, SCREENSHOT_PREFIX);
    fullPath = path.resolve(app.getPath('temp') + '/' + formattedFilename);
  }

  return fullPath;
};

module.exports = {
  REFERENCE_SCREENSHOT_FOLDER: REFERENCE_SCREENSHOT_FOLDER,
  getScreenshotFileName: formatScreenshotFileName,
  getScreenshotPath: getImagePath,
};
