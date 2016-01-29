'use strict';

var
  fs = require('fs'),
  util = require('util'),
  exists = require('./file-exists'),
  validation = require('./html/validation'),
  bestPractices = require('./html/best-practices'),
  elements = require('./html/elements'),
  content = require('./html/content')
;

const initChecks = function (listener, file, group) {
  if (file.valid) {
    validation.init(listener, group);
    if (file.bestPractices) bestPractices.init(listener, group);
  }

  if (file.has) elements.init(listener, group);
  if (file.search) content.init(listener, group);
};

module.exports.check = function (listener, path, file, group) {
  var
    errors = [],
    fullPath = path + '/' + file.path,
    fileContents = ''
  ;

  listener.send('check-group:item-new', group, 'exists', 'Exists');

  initChecks(listener, file, group);

  if (!exists.check(fullPath)) {
    listener.send('check-group:item-complete', group, 'exists', 'Exists', [util.format('The file `%s` is missing or misspelled', file.path)]);
    return;
  }

  listener.send('check-group:item-complete', group, 'exists', 'Exists');

  fs.readFile(fullPath, 'utf8', function (err, fileContents) {
    var lines = fileContents.toString().split('\n');

    if (file.valid) {
      validation.check(listener, fullPath, fileContents, lines, function (err) {
        if (!err || err.length <= 0) {
          if (file.bestPractices) bestPractices.check(fullPath, fileContents, lines);
        } else {
          bestPractices.bypass();
        }
      });
    }

    if (file.has) elements.check(fileContents, file.has);
    if (file.search) content.check(fileContents, file.search);
  });
};
