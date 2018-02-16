'use strict';

const path = require('path');

module.exports = function (file, fullPath) {
  const normalizedFile = path.normalize(file);
  const normalizedFullPath = path.normalize(fullPath);

  return normalizedFile.replace(normalizedFullPath, '').replace(/^[\/\\]/, '');
};
