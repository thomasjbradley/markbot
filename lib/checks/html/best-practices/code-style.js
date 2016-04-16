'use strict';

const linter = require('htmlcs');
const htmlcsOptions = require('./htmlcs.json');
const voidElements = require('./void-elements.json');
const voidElementsSearch = `(${voidElements.join('|')})`;
const svgTags = require('./svg-uppercase-tag-names.json');
const svgTagsSearch = `(${svgTags.join('|')})`;

// Replace the lowercase attr & tag pairing rules to support embedded SVG
linter.addRule(require('./rule-adv-attr-lowercase'));
linter.addRule(require('./rule-adv-tag-pair'));

const shouldIncludeError = function (line, message, lines) {
  // Don’t want indent checking from this library, use Beautify instead
  if (message.match(/indent/ig)) return false;

  // Ignore SVG multi-case tags
  if (message.match(/tagname.*lowercase/ig)) {
    // Not quite sure why it needs to be the previous line
    if (lines[line - 1].match(new RegExp(svgTagsSearch))) return false;
  }

  // Ignore SVG void elements
  if (message.match(/tag.*is.*not.*paired/ig)) {
    // Not quite sure why it needs to be the previous line
    if (lines[line - 1].match(new RegExp(voidElementsSearch))) return false;
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
        errors.push(`Line ${item.line}: ${item.message.replace(/</g, '`<').replace(/>/g, '>`')}`);
      }
    });
  }

  return errors;
};



