'use strict';

var
  path = require('path'),
  util = require('util'),
  dir = require('node-dir')
;

var stripPath = function (file, fullPath) {
  return file.replace(fullPath + '/', '');
};

module.exports.check = function (listener, filePath, group, cb) {
  var
    fullPath = path.resolve(filePath),
    label = 'Consistent naming'
  ;

  listener.send('check-group:item-new', group, 'naming', label);
  listener.send('check-group:item-computing', group, 'naming');

  dir.files(fullPath, function(err, files) {
    var errors = [];

    files = files.filter(function (file) {
      var cleanFile = stripPath(file, fullPath);

      return !cleanFile.match(/^(?:node_modules|\.|README.md|LICENSE)/);
    });

    files = files.filter(function (file) {
      var cleanFile = stripPath(file, fullPath);

      return !cleanFile.match(/(?:.DS_Store)$/);
    });

    files.forEach(function (file) {
      var cleanFile = stripPath(file, fullPath);

      if (cleanFile !== cleanFile.replace(/[^a-z0-9\-\.\/]/g, '')) {
        errors.push(util.format('`%s`: Doesn’t follow naming conventions', cleanFile));
      }
    });

    listener.send('check-group:item-complete', group, 'naming', label, errors);
  });
};
