'use strict';

const util = require('util');

module.exports.check = function (fileContents, lines) {
  let errors = [];
  let i = 0
  let total = lines.length;
  let emptyMax = 1;
  let emptyCount = 0;

  for (i; i < total; i++) {
    let line = lines[i].trim();

    if (line != '' && emptyCount > emptyMax) break;

    if (line == '') {
      emptyCount++

      if (emptyCount > emptyMax) {
        errors = [util.format('Line %d: Exceeded recommended number of empty lines (has %d, expected %d)', i, emptyCount, emptyMax)];
      }
    } else {
      emptyCount = 0;
    }
  }

  return errors;
};
