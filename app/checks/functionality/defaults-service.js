'use strict';

const fs = require('fs');
const path = require('path');

const get = function (file) {
  return fs.readFileSync(path.resolve(`${__dirname}/${file}`), 'utf8');
};

module.exports = {
  get: get,
};
