'use strict';

var
  util = require('util'),
  beautifier = require('js-beautify').html,
  beautifierOptions = require('./beautifier.json')
;

module.exports.check = function (fileContents, lines) {
  var
    errors = [],
    beautified = '',
    i = 0,
    total = lines.length,
    orgFrontSpace = false,
    goodFrontSpace = false,
    beautifiedLines
  ;


  beautified = beautifier(fileContents, beautifierOptions);

  for (i; i < total; i++) {
    orgFrontSpace = lines[i].match(/^(\s*)/);
    beautifiedLines = beautified.toString().split('\n');

    if (!beautifiedLines[i]) continue;

    goodFrontSpace = beautifiedLines[i].match(/^(\s*)/);

    if (orgFrontSpace[1].length != goodFrontSpace[1].length) {
      errors.push(util.format('Line %d: Expected indentation depth of %d spaces', i+1, goodFrontSpace[1].length));
    }
  }

  return errors;
};
