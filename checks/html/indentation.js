'use strict';

var
  beautifier = require('js-beautify').html,
  differ = require('diff')
;

module.exports.check = function (fileContents, group, cb) {
  var
    diffLines, lineCount = 0, skipNext = false,
    errors = [],
    beautified = ''
  ;

  cb('indentation', group, 'start', 'Indentation');

  beautified = beautifier(fileContents, {
    indent_size: 2,
    preserve_newlines: true,
    max_preserve_newlines: 10,
    wrap_line_length: 0,
    end_with_newline: true,
    extra_liners: []
  });

  if (fileContents != beautified) {
    diffLines = differ.diffLines(fileContents, beautified);

    diffLines.forEach(function (item) {
      if (!skipNext) {
        lineCount += item.count;

        if (item.added || item.removed) {
          skipNext = true;
          errors.push('Line ' + lineCount);
        }
      } else {
        skipNext = false;
      }
    });
  }

  cb('indentation', group, 'end', 'Indentation', errors);
};
