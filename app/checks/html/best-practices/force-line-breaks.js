'use strict';

const forceLineBreak = require('./force-line-break-tags.json');
const specificLineBreakChecks = require('./specific-line-break-checks.json');

const notProperLineBreaks = function (line) {
  const lineRegEx = '\<\/?(' + forceLineBreak.join('|') + ')(?:(?: [^>]*\>)|(?:\>))\\s*\<\/?(' + forceLineBreak.join('|') + ')';
  let generalChecks = line.match(new RegExp(lineRegEx, 'i'));
  let isEmptyTag = (generalChecks && generalChecks[1] && generalChecks[2]) ? new RegExp(`^<${generalChecks[1]}></${generalChecks[2]}>$`, '') : false;
  let i = 0, total = specificLineBreakChecks.length;
  let specificCheck;

  if (generalChecks && (isEmptyTag && !isEmptyTag.test(line.trim()))) return generalChecks;

  for (i ; i < total; i++) {
    specificCheck = line.match(new RegExp(specificLineBreakChecks[i]));

    if (specificCheck) return specificCheck;
  };

  return false;
}

module.exports.check = function (fileContents, lines) {
  let errors = [];
  let i = 0;
  let total = lines.length;

  for (i; i < total; i++) {
    let lineBreakIssues = notProperLineBreaks(lines[i]);

    if (lineBreakIssues) {
      errors.push(`Line ${i + 1}: The \`<${lineBreakIssues[1]}>\` and \`<${lineBreakIssues[2]}>\` elements should be on different lines`);
      break;
    }
  }

  return errors;
};
