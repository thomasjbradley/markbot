'use strict';

const path = require('path');
const dir = require('node-dir');
const stripPath = require('../strip-path');

module.exports.check = function (listener, filePath, group) {
  const fullPath = path.resolve(filePath);
  const label = 'Consistent naming';

  listener.send('check-group:item-new', group, 'naming', label);
  listener.send('check-group:item-computing', group, 'naming');

  dir.files(fullPath, function(err, files) {
    let errors = [];

    files = files.filter(function (file) {
      let cleanFile = stripPath(file, fullPath);

      return !cleanFile.match(/^(?:node_modules|\.|LICENSE|_site|tmp)/);
    });

    files = files.filter(function (file) {
      let cleanFile = stripPath(file, fullPath);

      return !cleanFile.match(/(?:.DS_Store|README.md)$/);
    });

    files.forEach(function (file) {
      let cleanFile = stripPath(file, fullPath);

      if (cleanFile !== cleanFile.replace(/[^a-z0-9\-\.\/\\]/g, '')) {
        errors.push(`\`${cleanFile.replace(/\\/, '/')}\`: Doesn’t follow naming conventions`);
      }
    });

    listener.send('check-group:item-complete', group, 'naming', label, errors);
  });
};
