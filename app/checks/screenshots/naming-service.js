'use strict';

const path = require('path');
const is = require('electron-is');
const classify = require(__dirname + '/../../classify');

const SCREENSHOT_PREFIX = 'markbot';
const REFERENCE_SCREENSHOT_FOLDER = 'screenshots';

let app;

if (is.renderer()) {
  app = require('electron').remote.app;
} else {
  app = require('electron').app;
}

const removeExtensionFromFile = function (filename) {
  return filename.replace(/\.html$/, '');
};

const makeScreenshotBasename = function (file) {
  const labelExtra = (file.label) ? `-${file.label}` : '';

  return classify(removeExtensionFromFile(file.path) + labelExtra);
};

const getScreenshotFilename = function (filename, width, prefix) {
  let pre = (prefix) ? `${prefix}-` : '';

  return `${pre}${classify(filename.replace(/\.html$/, ''))}-${width}.png`;
};

const getScreenshotPath = function (projectPath, filename, width, genRefScreens) {
  let formattedFilename, imgPath, fullPath;

  if (genRefScreens) {
    formattedFilename = getScreenshotFilename(filename, width);
    imgPath = path.resolve(path.resolve(projectPath) + '/' + REFERENCE_SCREENSHOT_FOLDER);
    fullPath = path.resolve(imgPath + '/' + formattedFilename);
  } else {
    formattedFilename = getScreenshotFilename(filename, width, SCREENSHOT_PREFIX);
    fullPath = path.resolve(app.getPath('temp') + '/' + formattedFilename);
  }

  return fullPath;
};

module.exports = {
  REFERENCE_SCREENSHOT_FOLDER: REFERENCE_SCREENSHOT_FOLDER,
  getScreenshotFilename: getScreenshotFilename,
  getScreenshotPath: getScreenshotPath,
  makeScreenshotBasename: makeScreenshotBasename,
};
