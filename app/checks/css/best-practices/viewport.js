'use strict';

module.exports.check = function (fileContents, lines) {
  let maxScale = /@viewport\s*\{[^}]*?max-zoom/im;
  let noUserScale = /@viewport\s*\{[^}]*?user-zoom\s*:\s*fixed/im;
  let errors = [];

  if (fileContents.match(maxScale)) errors.push(`The \`@viewport\` tag should never specify \`max-zoom\``);
  if (fileContents.match(noUserScale)) errors.push(`The \`@viewport\` tag should never specify \`user-zoom: fixed\``);

  return errors;
};
