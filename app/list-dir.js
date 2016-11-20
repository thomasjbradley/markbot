'use strict';

const path = require('path');
const dir = require('node-dir');
const stripPath = require('./strip-path');
const filesToIgnore = require('./files-to-ignore.json');

module.exports = function (dirPath, next) {
  const fullPath = path.resolve(dirPath);

  dir.files(fullPath, function(err, files) {
    let errors = [];

    files = files.filter(function (file) {
      let strippedPath = stripPath(file, fullPath);
      let cleanFileName = path.parse(file).base;

      if (strippedPath.match(new RegExp(`^(?:${filesToIgnore.join('|')})`))) return false;
      if (cleanFileName.match(new RegExp(`^(?:${filesToIgnore.join('|')})`))) return false;

      return true;
    });

    next(files);
  });
};
