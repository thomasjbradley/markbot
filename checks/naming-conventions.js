'use strict';

var
  util = require('util'),
  dir = require('node-dir')
;

var stripPath = function (file, path) {
  return file.replace(path + '/', '');
};

module.exports.check = function (path, group, cb) {
  var label = 'Consistent naming';

  cb('naming', group, 'start', label);

  dir.files(path, function(err, files) {
    var errors = [];

    files = files.filter(function (file) {
      var cleanFile = stripPath(file, path);

      return !cleanFile.match(/^(?:node_modules|\.|README.md|LICENSE)/);
    });

    files = files.filter(function (file) {
      var cleanFile = stripPath(file, path);

      return !cleanFile.match(/(?:.DS_Store)$/);
    });

    files.forEach(function (file) {
      var cleanFile = stripPath(file, path);

      if (cleanFile !== cleanFile.replace(/[^a-z0-9\-\.\/]/g, '')) {
        errors.push(util.format('`%s`: Doesn’t follow naming conventions', cleanFile));
      }
    });

    cb('naming', group, 'end', label, errors);
  });
};
