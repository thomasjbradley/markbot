'use strict';

var
  util = require('util'),
  linter = require('stylelint')
;

module.exports.check = function (fileContents, group, cb) {
  cb('best-practices', group, 'start', 'Best practices & indentation');

  linter.lint({code: fileContents, config: require('./stylelint.json')}).then(function (data) {
    var errors = [];

    if (data.results) {
      data.results[0].warnings.forEach(function (item) {
        errors.push(util.format('Line %d: %s', item.line, item.text));
      });
    }

    cb('best-practices', group, 'end', 'Best practices & indentation', errors);
  });
};
