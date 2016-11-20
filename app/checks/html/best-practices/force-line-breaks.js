'use strict';

const forceLineBreak = require('./force-line-break-tags.json');
const specificLineBreakChecks = require('./specific-line-break-checks.json');

const notProperLineBreaks = function (line) {
  var
    lineRegEx = '\<\/?(' + forceLineBreak.join('|') + ')(?:(?: [^>]*\>)|(?:\>))\\s*\<\/?(' + forceLineBreak.join('|') + ')',
    generalChecks = line.match(new RegExp(lineRegEx, 'i')),
    i = 0, total = specificLineBreakChecks.length,
    specificCheck
  ;

  if (generalChecks) return generalChecks;

  for (i ; i < total; i++) {
    specificCheck = line.match(new RegExp(specificLineBreakChecks[i]));

    if (specificCheck) return specificCheck;
  };

  return false;
}

module.exports.check = function (fileContents, lines) {
  var
    errors = [],
    i = 0,
    total = lines.length
  ;

  for (i; i < total; i++) {
    let lineBreakIssues = notProperLineBreaks(lines[i]);

    if (lineBreakIssues) {
      errors.push(`Line ${i + 1}: The \`<${lineBreakIssues[1]}>\` and \`<${lineBreakIssues[2]}>\` elements should be on different lines`);
      break;
    }
  }

  return errors;
};
