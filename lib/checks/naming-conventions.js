'use strict';

const path = require('path');
const listDir = require('../list-dir');
const stripPath = require('../strip-path');

module.exports.check = function (listener, filePath, group) {
  const fullPath = path.resolve(filePath);
  const label = 'Consistent naming';

  listener.send('check-group:item-new', group, 'naming', label);
  listener.send('check-group:item-computing', group, 'naming');

  listDir(fullPath, function(files) {
    let errors = [];

    files.forEach(function (file) {
      let cleanFile = stripPath(file, fullPath);

      if (cleanFile !== cleanFile.replace(/[^a-z0-9\-\.\/\\]/g, '')) {
        errors.push(`\`${cleanFile.replace(/\\/, '/')}\`: Doesn’t follow naming conventions`);
      }
    });

    listener.send('check-group:item-complete', group, 'naming', label, errors);
  });
};
