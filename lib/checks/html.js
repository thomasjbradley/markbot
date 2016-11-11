'use strict';

const fs = require('fs');
const path = require('path');
const exists = require('../file-exists');
const validation = require('./html/validation');
const bestPractices = require('./html/best-practices');
const outline = require('./html/outline');
const elements = require('./html/elements');
const performance = require('./html/performance');
const content = require('./content');

module.exports.check = function (listener, filePath, file, group, matchesLock) {
  const fullPath = path.resolve(filePath + '/' + file.path);
  let unique = {};
  let errors = [];
  let fileContents = '';
  let validationChecker;
  let bestPracticesChecker;
  let outlineChecker;
  let elementsChecker;
  let contentChecker;
  let performanceChecker;

  // Backwards compatibility
  if (file.has_not) file.hasNot = file.has_not;
  if (file.search_not) file.searchNot = file.search_not;

  const bypassAllChecks = function (f) {
    if (f.valid) validationChecker.bypass();
    if (f.bestPractices) bestPracticesChecker.bypass();
    if (f.outline) outlineChecker.bypass();
    if (f.has || f.hasNot) elementsChecker.bypass();
    if (f.search || f.searchNot) contentChecker.bypass();
    if (f.performance) performanceChecker.bypass();
  };

  listener.send('check-group:item-new', group, 'exists', 'Exists');

  if (file.valid) {
    validationChecker = validation.init(listener, group);
    if (file.bestPractices) bestPracticesChecker = bestPractices.init(listener, group);
    if (file.outline) outlineChecker = outline.init(listener, group);
    if (file.performance) performanceChecker = performance.init(listener, group);
  }

  if (file.has || file.hasNot) elementsChecker = elements.init(listener, group);
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
      validationChecker.check(fullPath, fileContents, lines, function (err) {
        if (!err || err.length <= 0) {
          if (file.bestPractices) bestPracticesChecker.check(fileContents, lines);
          if (file.outline) outlineChecker.check(fileContents, lines);
          if (file.performance) performanceChecker.check(filePath, fullPath, file);

          if (file.has || file.hasNot) {
            if (file.has && !file.hasNot) elementsChecker.check(fileContents, file.has, []);
            if (!file.has && file.hasNot) elementsChecker.check(fileContents, [], file.hasNot);
            if (file.has && file.hasNot) elementsChecker.check(fileContents, file.has, file.hasNot);
          }
        } else {
          if (file.bestPractices) bestPracticesChecker.bypass();
          if (file.outline) outlineChecker.bypass();
          if (file.has || file.hasNot) elementsChecker.bypass();
          if (file.performance) performanceChecker.bypass();
        }
      });
    } else {
      if (file.bestPractices && bestPracticesChecker) bestPracticesChecker.bypass();
      if (file.outline && outlineChecker) outlineChecker.bypass();
      if ((file.has || file.hasNot) && elementsChecker) elementsChecker.bypass();
      if (file.performance && performanceChecker) performanceChecker.bypass();

      if (!file.locked) listener.send('debug', 'Best practices, outlines, has/not & performance cannot be checked with completing validation checks.');
    }

    if (file.search || file.searchNot) {
      if (file.search && !file.searchNot) contentChecker.check(fileContents, file.search, []);
      if (!file.search && file.searchNot) contentChecker.check(fileContents, [], file.searchNot);
      if (file.search && file.searchNot) contentChecker.check(fileContents, file.search, file.searchNot);
    }
  });
};
