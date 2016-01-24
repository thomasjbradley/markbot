'use strict';

var
  util = require('util'),
  linter = require('htmlcs')
;

module.exports.check = function (fileContents, group, cb) {
  var
    lintResults = '',
    errors = []
  ;

  cb('best-practices', group, 'start', 'Best practices');

  lintResults = linter.hint(fileContents, require('./htmlcs.json'))

  if (lintResults.length > 0) {
    lintResults.forEach(function (item) {
      errors.push(util.format('Line %d: %s', item.line, item.message));
    });
  }

  cb('best-practices', group, 'end', 'Best practices', errors);
};
