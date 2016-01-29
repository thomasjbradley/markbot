'use strict';

const
  util = require('util')
;

module.exports.check = function (fileContents, lines) {
  var
    errors = [],
    i = 0, total = lines.length,
    onlyP = /^<p[^>]*>$/i,
    startsWithP = /^<p[\s>]/i,
    hasBreak = /<br/i,
    endsWithP = /<\/p>$/i
  ;

  for (i; i < total; i++) {
    let line = lines[i].trim();

    if (/*!line.match(onlyP) &&*/ line.match(startsWithP) /*&& !line.match(hasBreak)*/ && !line.match(endsWithP)) {
      errors.push(util.format('Line %d: Closing p tag should be on the same line as the opening p tag.', i + 1));
      break;
    }
  }

  return errors;
};
