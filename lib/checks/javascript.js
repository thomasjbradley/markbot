'use strict';

const fs = require('fs');
const path = require('path');
const exists = require('../file-exists');
const validation = require('./js/validation');
const bestPractices = require('./js/best-practices');
const content = require('./content');

module.exports.check = function (listener, filePath, file, group, matchesLock) {
  const fullPath = path.resolve(filePath + '/' + file.path);
  let errors = [];
  let fileContents = '';
  let validationChecker;
  let bestPracticesChecker;
  let contentChecker;

  // Backwards compatibility
  if (file.search_not) file.searchNot = file.search_not;

  const bypassAllChecks = function (f) {
    if (f.valid) validationChecker.bypass();
    if (f.bestPractices) bestPracticesChecker.bypass();
    if (f.search || f.searchNot) contentChecker.bypass();
  };

  listener.send('check-group:item-new', group, 'exists', 'Exists');

  if (file.valid) {
    validationChecker = validation.init(listener, group);
    if (file.bestPractices) bestPracticesChecker = bestPractices.init(listener, group);
  }

  if (file.search || file.searchNot) contentChecker = content.init(listener, group);

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

    if (file.search || file.searchNot) {
      if (file.search && !file.searchNot) contentChecker.check(fileContents, file.search, []);
      if (!file.search && file.searchNot) contentChecker.check(fileContents, [], file.searchNot);
      if (file.search && file.searchNot) contentChecker.check(fileContents, file.search, file.searchNot);
    }
  });
};
