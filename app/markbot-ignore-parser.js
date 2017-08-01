'use strict';

const fs = require('fs');
const path = require('path');
const exists = require('./file-exists');

const MARKBOT_IGNORE_FILE = '.markbotignore';

const parse = function (fullPath, next) {
  const ignoreFilePath = path.resolve(`${fullPath}/${MARKBOT_IGNORE_FILE}`);

  if (!exists.check(ignoreFilePath)) return next([]);

  fs.readFile(ignoreFilePath, 'utf8', (err, data) => {
    let lines;

    if (data.trim() === '') return next([]);

    lines = data.split(/[\n\u0085\u2028\u2029]|\r\n?/g)
      .map((line) => line.trim())
      .filter((line) => (line))
    ;

    next(lines);
  });
};

module.exports = {
  parse: parse,
};
