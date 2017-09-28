'use strict';

const pkg = require('../package');

module.exports.get = function () {
  return `Markbot/${pkg.version} (+https://github.com/thomasjbradley/markbot)`;
};
