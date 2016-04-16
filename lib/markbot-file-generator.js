'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const dir = require('node-dir');
const merge = require('merge-objects');
const stripPath = require('./strip-path');

const getFileCodeLang = function (fullPath) {
  return fullPath.match(/\.(html|css|js)$/)[1];
};

const findCompatibleFiles = function (filePath, next) {
  let fullPath = path.resolve(filePath);
  let compatibleFileExts = /\.(html|css|js)$/;
  let minFileExts = /min\.(html|css|js)$/;

  dir.files(fullPath, function(err, files) {
    files = files.filter(function (file) {
      if (file.match(minFileExts)) return false;
      if (file.match(compatibleFileExts)) return true;

      return false;
    });

    next(files);
  });
};

const populateDefaults = function (markbotFile) {
  let keys = ['html', 'css', 'js', 'functionality'];

  if (!markbotFile.defaults) return markbotFile;

  keys.forEach(function (key) {
    if (!markbotFile[key]) return;

    markbotFile[key].forEach(function (item, i) {
      if (!markbotFile.defaults[key]) return;

      markbotFile[key][i] = merge(Object.assign({}, markbotFile.defaults[key]), item);
    });
  });

  return markbotFile;
}

const getMarkbotFile = function (filePath, next) {
  let markbotFile = yaml.safeLoad(fs.readFileSync(filePath, 'utf8'));

  next(populateDefaults(markbotFile));
};

const buildFromFolder = function (fullPath, next) {
  findCompatibleFiles(fullPath, function (files) {
    let markbotFile = yaml.safeLoad(fs.readFileSync(path.resolve(__dirname + '/../templates/markbot-internal-dropped-folder.yml'), 'utf8'));

    if (markbotFile.defaults.functionality) markbotFile.functionality = [];

    files.forEach(function (file) {
      let codelang = getFileCodeLang(file);

      if (!markbotFile[codelang]) markbotFile[codelang] = [];

      markbotFile[codelang].push({ path: stripPath(file, fullPath) });

      if (markbotFile.defaults.functionality) {
        if (codelang == 'html') markbotFile.functionality.push({ path: stripPath(file, fullPath) });
      }
    });

    next(populateDefaults(markbotFile));
  });
};

module.exports = {
  get: getMarkbotFile,
  buildFromFolder: buildFromFolder
};
