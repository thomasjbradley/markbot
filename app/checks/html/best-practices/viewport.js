'use strict';

module.exports.check = function (fileContents, lines) {
  let maxScale = /<meta[^>]*?viewport[^>]*?maximum-scale/im;
  let noUserScale = /<meta[^>]*?viewport[^>]*?user-scalable\s*?=\s*no/im;
  let errors = [];

  if (fileContents.match(maxScale)) errors.push(`The \`viewport\` tag should never specify \`maximum-scale\``);
  if (fileContents.match(noUserScale)) errors.push(`The \`viewport\` tag should never specify \`user-scalable=no\``);

  return errors;
};
