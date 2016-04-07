'use strict';

var
  fs = require('fs'),
  path = require('path'),
  exists = require('../file-exists'),
  validation = require('./js/validation'),
  bestPractices = require('./js/best-practices'),
  content = require('./content')
;

module.exports.check = function (listener, filePath, file, group, matchesLock) {
  var
    errors = [],
    fullPath = path.resolve(filePath + '/' + file.path),
    fileContents = '',
    validationChecker,
    bestPracticesChecker,
    contentChecker
  ;

  const bypassAllChecks = function (f) {
    if (f.valid) validationChecker.bypass();
    if (f.bestPractices) bestPracticesChecker.bypass();
    if (f.search || f.search_not) contentChecker.bypass();
  };

  listener.send('check-group:item-new', group, 'exists', 'Exists');

  if (file.valid) {
    validationChecker = validation.init(listener, group);
    if (file.bestPractices) bestPracticesChecker = bestPractices.init(listener, group);
  }

  if (file.search || file.search_not) contentChecker = content.init(listener, group);

  if (!exists.check(fullPath)) {
    listener.send('check-group:item-complete', group, 'exists', 'Exists', [`The file \`${file.path}\` is missing or misspelled`]);
    bypassAllChecks(file);
    return;
  }

  if (file.locked) {
    listener.send('check-group:item-new', group, 'unchanged', 'Unchanged');

    if (!matchesLock) {
      listener.send('check-group:item-complete', group, 'unchanged', 'Unchanged', [`The \`${file.path}\` should not be changed`]);
    } else {
      listener.send('check-group:item-complete', group, 'unchanged', 'Unchanged');
    }
  }

  fs.readFile(fullPath, 'utf8', function (err, fileContents) {
    var lines;

    if (fileContents.trim() == '') {
      listener.send('check-group:item-complete', group, 'exists', 'Exists', [`The file \`${file.path}\` is empty`]);
      bypassAllChecks(file);
      return;
    }

    listener.send('check-group:item-complete', group, 'exists', 'Exists');
    lines = fileContents.toString().split(/[\n\u0085\u2028\u2029]|\r\n?/g);

    if (file.valid) {
      validationChecker.check(fileContents, lines, function (err) {
        if (!err || err.length <= 0) {
          if (file.bestPractices) bestPracticesChecker.check(fileContents, lines);
        } else {
          bestPracticesChecker.bypass();
        }
      });
    }

    if (file.search || file.search_not) {
      if (file.search && !file.search_not) contentChecker.check(fileContents, file.search, []);
      if (!file.search && file.search_not) contentChecker.check(fileContents, [], file.search_not);
      if (file.search && file.search_not) contentChecker.check(fileContents, file.search, file.search_not);
    }
  });
};
