'use strict';

var
  util = require('util'),
  linter = require('htmlcs'),
  htmlcsOptions = require('./htmlcs.json'),
  svgTags = require('./svg-uppercase-tag-names.json'),
  svgTagsSearch = '(' + svgTags.join('|') + ')'
;

// Replace the lowercase attr & tag pairing rules to support embedded SVG
linter.addRule(require('./rule-adv-attr-lowercase'));
linter.addRule(require('./rule-adv-tag-pair'));

const shouldIncludeError = function (line, message, lines) {
  if (message.match(/indent/ig)) return false;

  if (message.match(/tagname.*lowercase/ig)) {
    // Not quite sure why it needs to be the previous line
    if (lines[line - 1].match(new RegExp(svgTagsSearch))) return false;
  }

  return true;
};

module.exports.check = function (fileContents, lines) {
  var
    lintResults,
    errors = []
  ;

  lintResults = linter.hint(fileContents, htmlcsOptions)

  if (lintResults.length > 0) {
    lintResults.forEach(function (item) {
      if (shouldIncludeError(item.line, item.message, lines)) {
        errors.push(util.format('Line %d: %s', item.line, item.message));
      }
    });
  }

  return errors;
};



