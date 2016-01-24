'use strict';

var fs = require('fs');

module.exports.check = function (path) {
  var exists = false;

  try {
    exists = fs.statSync(path).isFile();
  } catch (e) {
    exists = false;
  }

  return exists;
};
