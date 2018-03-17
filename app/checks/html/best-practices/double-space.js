'use strict';

module.exports.check = function (fileContents, lines) {
  let errors = [];

  lines.forEach(function (line, i) {
    let lineTrim = line.trim();

    if (lineTrim.match(/ {2,}/) && !lineTrim.match(/^\<(?:pre|textarea|code)/)) {
      let codeHunk = lineTrim.match(/.{0,15} {2,}.{0,15}/)[0];
      codeHunk = codeHunk.replace(/( {2,})/, '~~$1~~');

      errors.push(`Line ${i + 1}: There are extra spaces in the code around \`…${codeHunk}…\``);
    }
  });

  return errors;
};
