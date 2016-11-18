'use strict';

const fs = require('fs');
const path = require('path');
const exists = require('../file-exists');
const validation = require('./css/validation');
const bestPractices = require('./css/best-practices');
const properties = require('./css/properties');
const content = require('./content');
const markbotMain = require('../markbot-main');

module.exports.check = function (filePath, file, group, matchesLock) {
  const fullPath = path.resolve(filePath + '/' + file.path);
  let errors = [];
  let fileContents = '';
  let validationChecker;
  let bestPracticesChecker;
  let propertiesChecker;
  let contentChecker;

  // Backwards compatibility
  if (file.has_not) file.hasNot = file.has_not;
  if (file.search_not) file.searchNot = file.search_not;

  const bypassAllChecks = function (f) {
    if (f.valid) validationChecker.bypass();
    if (f.bestPractices) bestPracticesChecker.bypass();
    if (f.has || f.hasNot) propertiesChecker.bypass();
    if (f.search || f.searchNot) contentChecker.bypass();
  };

  markbotMain.send('check-group:item-new', group, 'exists', 'Exists');

  if (file.valid) {
    validationChecker = validation.init(group);
    if (file.bestPractices) bestPracticesChecker = bestPractices.init(group);
  }

  if (file.has || file.hasNot) propertiesChecker = properties.init(group);
  if (file.search || file.searchNot) contentChecker = content.init(group);

  if (!exists.check(fullPath)) {
    markbotMain.send('check-group:item-complete', group, 'exists', 'Exists', [`The file \`${file.path}\` is missing or misspelled`]);
    bypassAllChecks(file);
    return;
  }

  if (file.locked) {
    markbotMain.send('check-group:item-new', group, 'unchanged', 'Unchanged');

    if (!matchesLock) {
      markbotMain.send('check-group:item-complete', group, 'unchanged', 'Unchanged', [`The \`${file.path}\` should not be changed`]);
    } else {
      markbotMain.send('check-group:item-complete', group, 'unchanged', 'Unchanged');
    }
  }

  fs.readFile(fullPath, 'utf8', function (err, fileContents) {
    var lines;

    if (fileContents.trim() == '') {
      markbotMain.send('check-group:item-complete', group, 'exists', 'Exists', [`The file \`${file.path}\` is empty`]);
      bypassAllChecks(file);
      return;
    }

    markbotMain.send('check-group:item-complete', group, 'exists', 'Exists');
    lines = fileContents.toString().split(/[\n\u0085\u2028\u2029]|\r\n?/g);

    if (file.valid) {
      validationChecker.check(fullPath, fileContents, lines, function (err) {
        if (!err || err.length <= 0) {
          if (file.bestPractices) bestPracticesChecker.check(fileContents, lines);

          if (file.has || file.hasNot) {
            if (file.has && !file.hasNot) propertiesChecker.check(fileContents, file.has, []);
            if (!file.has && file.hasNot) propertiesChecker.check(fileContents, [], file.hasNot);
            if (file.has && file.hasNot) propertiesChecker.check(fileContents, file.has, file.hasNot);
          }
        } else {
          if (file.bestPractices) bestPracticesChecker.bypass();
          if (file.has || file.hasNot) propertiesChecker.bypass();
        }
      });
    } else {
      if (file.bestPractices) bestPracticesChecker.bypass();
      if (file.has || file.hasNot) propertiesChecker.bypass();
    }

    if (file.search || file.searchNot) {
      if (file.search && !file.searchNot) contentChecker.check(fileContents, file.search, []);
      if (!file.search && file.searchNot) contentChecker.check(fileContents, [], file.searchNot);
      if (file.search && file.searchNot) contentChecker.check(fileContents, file.search, file.searchNot);
    }
  });
};
