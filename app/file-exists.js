'use strict';

var fs = require('fs');

module.exports.check = function (path) {
  var exists = false;

  try {
    let stats = fs.statSync(path);
    exists = (stats.isFile() || stats.isDirectory());
  } catch (e) {
    exists = false;
  }

  return exists;
};
