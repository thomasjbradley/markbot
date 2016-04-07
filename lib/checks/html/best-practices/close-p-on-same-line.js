'use strict';

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

    if (line.match(startsWithP) && !line.match(endsWithP)) {
      errors.push(`Line ${i + 1}: Closing \`</p>\` tag should be on the same line as the opening \`<p>\` tag`);
      break;
    }
  }

  return errors;
};
