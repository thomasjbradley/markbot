'use strict';

var
  fs = require('fs'),
  path = require('path'),
  util = require('util'),
  exists = require('./file-exists'),
  validation = require('./html/validation'),
  bestPractices = require('./html/best-practices'),
  elements = require('./html/elements'),
  content = require('./content')
;

module.exports.check = function (listener, filePath, file, group) {
  var
    errors = [],
    fullPath = path.resolve(filePath + '/' + file.path),
    fileContents = '',
    validationChecker,
    bestPracticesChecker,
    elementsChecker,
    contentChecker
  ;

  const bypassAllChecks = function (f) {
    if (f.valid) validationChecker.bypass();
    if (f.bestPractices) bestPracticesChecker.bypass();
    if (f.has) elementsChecker.bypass();
    if (f.search) contentChecker.bypass();
  };

  listener.send('check-group:item-new', group, 'exists', 'Exists');

  if (file.valid) {
    validationChecker = validation.init(listener, group);
    if (file.bestPractices) bestPracticesChecker = bestPractices.init(listener, group);
  }

  if (file.has) elementsChecker = elements.init(listener, group);
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
          if (file.has) elementsChecker.check(fileContents, file.has);
        } else {
          if (file.bestPractices) bestPracticesChecker.bypass();
          if (file.has) elementsChecker.bypass();
        }
      });
    }

    if (file.search) contentChecker.check(fileContents, file.search);
  });
};
