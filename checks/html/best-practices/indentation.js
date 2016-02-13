'use strict';

var
  util = require('util'),
  beautifier = require('js-beautify').html,
  beautifierOptions = require('./beautifier.json')
;

// Work around for Beautifier’s wrap max limit of 32786
// https://github.com/beautify-web/js-beautify/blob/master/js/lib/beautify-html.js#L118
if (beautifierOptions.wrap_line_length == 0) {
  beautifierOptions.wrap_line_length = Number.MAX_SAFE_INTEGER;
}

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

const shouldThrowBreakingError = function (line1, line2) {
  // Ignore addition of space before self-closing slash, like `/>`
  if (line1.trim().replace(/\/>$/, '').trim() == line2.trim().replace(/\/>$/, '').trim()) return false;

  return true;
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
      if (shouldThrowBreakingError(lines[i], beautifiedLines[i])) {
        errors.push([
          util.format('Around line %d: Unexpected indentation', i + 1),
          grabChunk(i, lines, beautifiedLines),
          { type: 'skip' }
        ]);
        break;
      }
    }

    goodFrontSpace = beautifiedLines[i].match(/^(\s*)/);

    if (orgFrontSpace[1].length != goodFrontSpace[1].length) {
      errors.push(util.format('Line %d: Expected indentation depth of %d spaces', i + 1, goodFrontSpace[1].length));
    }
  }

  return errors;
};
