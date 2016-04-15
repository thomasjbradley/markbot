'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const dir = require('node-dir');

const stripPath = function (file, fullPath) {
  return file.replace(fullPath, '').replace(/^[\/\\]/, '');
};

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

const getMarkbotFile = function (filePath, next) {
  next(yaml.safeLoad(fs.readFileSync(filePath, 'utf8')));
};

const buildFromFolder = function (fullPath, next) {
  findCompatibleFiles(fullPath, function (files) {
    let markbotFile = yaml.safeLoad(fs.readFileSync(path.resolve(__dirname + '/../templates/dropped-folder/.markbot.yml'), 'utf8'));

    if (markbotFile.defaults.functionality) markbotFile.functionality = [];

    files.forEach(function (file) {
      let codelang = getFileCodeLang(file);

      if (!markbotFile[codelang]) markbotFile[codelang] = [];

      markbotFile[codelang].push(
        Object.assign(
          { path: stripPath(file, fullPath) },
          markbotFile.defaults[codelang]
        )
      );

      if (markbotFile.defaults.functionality) {
        if (codelang == 'html') {
          markbotFile.functionality.push(
            Object.assign(
              { path: stripPath(file, fullPath) },
              markbotFile.defaults.functionality
            )
          );
        }
      }
    });

    next(markbotFile);
  });
};

module.exports = {
  get: getMarkbotFile,
  buildFromFolder: buildFromFolder
};
