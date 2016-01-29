'use strict';

var
  util = require('util')
;

module.exports.check = function (fileContents, lines) {
  var
    errors = [],
    i = 0, total = lines.length,
    emptyMax = 1,
    emptyCount = 0
  ;

  for (i; i < total; i++) {
    let line = lines[i].trim();

    if (line != '' && emptyCount > emptyMax) break;

    if (line == '') {
      emptyCount++

      if (emptyCount > emptyMax) {
        errors = [util.format('Line %d: Exceeded recommended number of empty lines (has %d, expected %d).', i, emptyCount, emptyMax)];
      }
    } else {
      emptyCount = 0;
    }
  }

  return errors;
};
