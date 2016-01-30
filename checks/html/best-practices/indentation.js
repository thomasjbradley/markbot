'use strict';

var
  util = require('util'),
  beautifier = require('js-beautify').html,
  beautifierOptions = require('./beautifier.json')
;

const grabChunk = function (line, lines, beautifiedLines) {
  var hunk = { saw: [], expected: [], line: 0 };

  if (line > 2) {
    hunk.saw.push(lines[line - 2]);
    hunk.expected.push(beautifiedLines[line - 2]);
    hunk.line++;
  }

  if (line > 1) {
    hunk.saw.push(lines[line - 1]);
    hunk.expected.push(beautifiedLines[line - 1]);
    hunk.line++;
  }

  hunk.saw.push(lines[line]);
  hunk.expected.push(beautifiedLines[line]);

  if (lines.length > line + 1 && beautifiedLines.length > line + 1) {
    hunk.saw.push(lines[line + 1]);
    hunk.expected.push(beautifiedLines[line + 1]);
  }

  if (lines.length > line + 2 && beautifiedLines.length > line + 2) {
    hunk.saw.push(lines[line + 2]);
    hunk.expected.push(beautifiedLines[line + 2]);
  }

  return hunk;
};

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
  beautifiedLines = beautified.toString().split('\n');

  for (i; i < total; i++) {
    orgFrontSpace = lines[i].match(/^(\s*)/);

    if (!beautifiedLines[i]) continue;

    if (lines[i].trim() != beautifiedLines[i].trim()) {
      errors.push([
        util.format('Around line %d: Unexpected indentation', i + 1),
        grabChunk(i, lines, beautifiedLines),
        { type: 'skip' }
      ]);
      break;
    }

    goodFrontSpace = beautifiedLines[i].match(/^(\s*)/);

    if (orgFrontSpace[1].length != goodFrontSpace[1].length) {
      errors.push(util.format('Line %d: Expected indentation depth of %d spaces', i + 1, goodFrontSpace[1].length));
    }
  }

  return errors;
};
