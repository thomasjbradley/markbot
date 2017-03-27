'use strict';

const path = require('path');
const dir = require('node-dir');
const stripPath = require('./strip-path');
const markbotIgnoreParser = require('./markbot-ignore-parser');
const filesToIgnore = require('./files-to-ignore.json');

module.exports = function (dirPath, next) {
  const fullPath = path.resolve(dirPath);
  const matcher = new RegExp(`^(?:${filesToIgnore.join('|')})`);

  markbotIgnoreParser.parse(fullPath, (ignoreFiles) => {
    const ignoreMatcher = (ignoreFiles.length > 0) ? new RegExp(`^(?:${ignoreFiles.join('|')})`) : false;

    dir.files(fullPath, (err, files) =>{
      let errors = [];

      files = files.filter( (file) => {
        const strippedPath = stripPath(file, fullPath);
        const cleanFileName = path.parse(file).base;

        if (matcher.test(strippedPath)) return false;
        if (matcher.test(cleanFileName)) return false;

        if (ignoreMatcher) {
          if (ignoreMatcher.test(strippedPath)) return false;
          if (ignoreMatcher.test(cleanFileName)) return false;
        }

        return true;
      });

      next(files);
    });
  });
};
