'use strict';

var
  util = require('util'),
  beautifier = require('js-beautify').html
;

module.exports.check = function (fileContents, lines, group, cb) {
  var
    diffLines, lineCount = 0, skipNext = false,
    errors = [],
    beautified = '',
    beautifiedLines = [],
    i = 0, total = 0,
    orgFrontSpace = false,
    goodFrontSpace = false
  ;

  cb('indentation', group, 'start', 'Indentation');

  beautified = beautifier(fileContents, {
    indent_size: 2,
    preserve_newlines: true,
    max_preserve_newlines: 10,
    wrap_line_length: 0,
    end_with_newline: true,
    extra_liners: [],
    unformatted: [
      // Replace all unformatted to support newer elements and SVG
      'a', 'span', 'img', 'bdo', 'em', 'strong', 'dfn', 'code', 'samp', 'kbd', 'data',
      'cite', 'abbr', 'acronym', 'q', 'sub', 'sup', 'tt', 'i', 'b', 'big', 'small', 'u', 's', 'strike',
      'var', 'ins', 'del', 'pre', 'address', 'dt', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'path', 'use',
    ]
  });

  if (fileContents != beautified) {
    total = lines.length;
    beautifiedLines = beautified.toString().split('\n');

    for (i; i < total; i++) {
      orgFrontSpace = lines[i].match(/^(\s*)/);

      if (!beautifiedLines[i]) continue;

      goodFrontSpace = beautifiedLines[i].match(/^(\s*)/);

      if (orgFrontSpace[1].length != goodFrontSpace[1].length) {
        errors.push(util.format('Line %d: Expected indentation depth of %d spaces', i+1, goodFrontSpace[1].length));
      }
    }
  }

  cb('indentation', group, 'end', 'Indentation', errors);
};
