'use strict';

module.exports.check = function (fileContents, lines) {
  let errors = [];

  lines.forEach(function (line, i) {
    let lineTrim = line.trim();

    if (lineTrim.match(/ \>/)) {
      let codeHunk = lineTrim.match(/.{0,15} \>.{0,15}/)[0];
      codeHunk = codeHunk.replace(/( \>)/, '~~$1~~');

      errors.push(`Line ${i + 1}: There are extra spaces before the closing \`>\` in this tag: \`…${codeHunk}…\``);
    }
  });

  return errors;
};
