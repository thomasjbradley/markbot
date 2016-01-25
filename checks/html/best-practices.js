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

  // Replace the lowercase attr & tag pairing rules to support embedded SVG
  linter.addRule(require('./rule-adv-attr-lowercase'));
  linter.addRule(require('./rule-adv-tag-pair'));

  lintResults = linter.hint(fileContents, require('./htmlcs.json'))

  if (lintResults.length > 0) {
    lintResults.forEach(function (item) {
      errors.push(util.format('Line %d: %s', item.line, item.message));
    });
  }

  cb('best-practices', group, 'end', 'Best practices', errors);
};
