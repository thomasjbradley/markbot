'use strict';

var
  fs = require('fs'),
  util = require('util'),
  exists = require('./file-exists'),
  validation = require('./html/validation'),
  bestPractices = require('./html/best-practices'),
  indentation = require('./html/indentation'),
  elements = require('./html/elements'),
  content = require('./content')
;

module.exports.check = function (path, file, group, cb) {
  var
    errors = [],
    fullPath = path + '/' + file.path,
    fileContents = ''
  ;

  cb('exists', group, 'start', 'Exists');

  if (!exists.check(fullPath)) {
    cb('exists', group, 'end', 'Exists', [util.format('The file `%s` is missing or misspelled', file.path)]);
    return;
  }

  cb('exists', group, 'end', 'Exists');

  fs.readFile(fullPath, 'utf8', function (err, fileContents) {
    if (file.valid) validation.check(fileContents, fullPath, group, cb);

    if (file.bestPractices) {
      bestPractices.check(fileContents, group, cb);
      indentation.check(fileContents, group, cb);
    }

    if (file.has) elements.check(fileContents, file.has, group, cb);

    if (file.search) content.check(fileContents, file.search, group, cb);
  });
};
