'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const dir = require('node-dir');
const merge = require('merge-objects');
const exists = require('./file-exists');
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
  let newMarkbotFile = {};

  if (!markbotFile.allFiles && !markbotFile.inherit) return markbotFile;

  if (markbotFile.inherit) {
    let inheritPath = path.resolve(`${__dirname}/../templates/${markbotFile.inherit}.yml`);

    if (exists.check(inheritPath)) {
      newMarkbotFile = yaml.safeLoad(fs.readFileSync(inheritPath, 'utf8'));
    } else {
      newMarkbotFile.inheritFileNotFound = true;
    }

    markbotFile = merge(newMarkbotFile, markbotFile);
  }

  if (markbotFile.allFiles) {
    if (Object.getOwnPropertyNames(newMarkbotFile).length <= 0) newMarkbotFile = markbotFile;

    keys.forEach(function (key) {
      if (!newMarkbotFile[key]) return;

      newMarkbotFile[key].forEach(function (item, i) {
        if (!newMarkbotFile.allFiles[key]) return;

        newMarkbotFile[key][i] = merge(Object.assign({}, newMarkbotFile.allFiles[key]), item);
      });
    });

    if (newMarkbotFile.allFiles && newMarkbotFile.allFiles.functionality && newMarkbotFile.html) {
      if (!newMarkbotFile.functionality) newMarkbotFile.functionality = [];

      newMarkbotFile.html.forEach(function (file) {
        newMarkbotFile.functionality.push(merge({ path: file.path }, newMarkbotFile.allFiles.functionality));
      });
    }
  }

  return newMarkbotFile;
}

const getMarkbotFile = function (filePath, next) {
  let markbotFile = yaml.safeLoad(fs.readFileSync(filePath, 'utf8'));

  next(populateDefaults(markbotFile));
};

const buildFromFolder = function (fullPath, next) {
  findCompatibleFiles(fullPath, function (files) {
    let markbotFile = yaml.safeLoad(fs.readFileSync(path.resolve(__dirname + '/../templates/basic-dropped-folder.yml'), 'utf8'));

    files.forEach(function (file) {
      let codelang = getFileCodeLang(file);

      if (!markbotFile[codelang]) markbotFile[codelang] = [];

      markbotFile[codelang].push({ path: stripPath(file, fullPath) });
    });

    next(populateDefaults(markbotFile));
  });
};

module.exports = {
  get: getMarkbotFile,
  buildFromFolder: buildFromFolder
};
