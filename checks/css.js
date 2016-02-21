'use strict';

var
  fs = require('fs'),
  path = require('path'),
  util = require('util'),
  exists = require('./file-exists'),
  validation = require('./css/validation'),
  bestPractices = require('./css/best-practices'),
  properties = require('./css/properties'),
  content = require('./content')
;

module.exports.check = function (listener, filePath, file, group) {
  var
    errors = [],
    fullPath = path.resolve(filePath + '/' + file.path),
    fileContents = '',
    validationChecker,
    bestPracticesChecker,
    propertiesChecker,
    contentChecker
  ;

  const bypassAllChecks = function (f) {
    if (f.valid) validationChecker.bypass();
    if (f.bestPractices) bestPracticesChecker.bypass();
    if (f.has || f.has_not) propertiesChecker.bypass();
    if (f.search) contentChecker.bypass();
  };

  listener.send('check-group:item-new', group, 'exists', 'Exists');

  if (file.valid) {
    validationChecker = validation.init(listener, group);
    if (file.bestPractices) bestPracticesChecker = bestPractices.init(listener, group);
  }

  if (file.has || file.has_not) propertiesChecker = properties.init(listener, group);
  if (file.search) contentChecker = content.init(listener, group);

  if (!exists.check(fullPath)) {
    listener.send('check-group:item-complete', group, 'exists', 'Exists', [util.format('The file `%s` is missing or misspelled', file.path)]);
    bypassAllChecks(file);
    return;
  }

  fs.readFile(fullPath, 'utf8', function (err, fileContents) {
    var lines;

    if (fileContents.trim() == '') {
      listener.send('check-group:item-complete', group, 'exists', 'Exists', [util.format('The file `%s` is empty', file.path)]);
      bypassAllChecks(file);
      return;
    }

    listener.send('check-group:item-complete', group, 'exists', 'Exists');
    lines = fileContents.toString().split('\n');

    if (file.valid) {
      validationChecker.check(fullPath, fileContents, lines, function (err) {
        if (!err || err.length <= 0) {
          if (file.bestPractices) bestPracticesChecker.check(fileContents, lines);
        } else {
          bestPracticesChecker.bypass();
        }
      });
    }

    if (file.has || file.has_not) {
      if (file.has && !file.has_not) propertiesChecker.check(fileContents, file.has, []);
      if (!file.has && file.has_not) propertiesChecker.check(fileContents, [], file.has_not);
      if (file.has && file.has_not) propertiesChecker.check(fileContents, file.has, file.has_not);
    }

    if (file.search) contentChecker.check(fileContents, file.search);
  });
};
