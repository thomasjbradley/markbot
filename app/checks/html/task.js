(function () {
  'use strict';

  const fs = require('fs');
  const path = require('path');
  const exists = require('./file-exists');
  const validation = require('./checks/html/validation');
  const bestPractices = require('./checks/html/best-practices');
  const outline = require('./checks/html/outline');
  const elements = require('./checks/html/elements');
  const content = require('./checks/content');
  const markbotMain = require('electron').remote.require('./app/markbot-main');

  const group = taskDetails.group;
  const file = taskDetails.options.file;
  const isCheater = taskDetails.options.cheater;

  let checksToComplete = 0;

  const checkIfDone = function () {
    checksToComplete--;

    if (checksToComplete <= 0) done();
  };

  const check = function () {
    const fullPath = path.resolve(taskDetails.cwd + '/' + file.path);
    let unique = {};
    let errors = [];
    let fileContents = '';
    let validationChecker;
    let bestPracticesChecker;
    let outlineChecker;
    let elementsChecker;
    let contentChecker;

    // Backwards compatibility
    if (file.has_not) file.hasNot = file.has_not;
    if (file.search_not) file.searchNot = file.search_not;

    const bypassAllChecks = function (f) {
      checksToComplete = 0;

      if (f.valid) validationChecker.bypass();
      if (f.bestPractices) bestPracticesChecker.bypass();
      if (f.outline) outlineChecker.bypass();
      if (f.has || f.hasNot) elementsChecker.bypass();
      if (f.search || f.searchNot) contentChecker.bypass();
    };

    checksToComplete++;
    markbotMain.send('check-group:item-new', group, 'exists', 'Exists');

    if (file.valid) {
      checksToComplete++;
      validationChecker = validation.init(group);

      if (file.bestPractices) {
        checksToComplete++;
        bestPracticesChecker = bestPractices.init(group)
      };

      if (file.outline) {
        checksToComplete++;
        outlineChecker = outline.init(group)
      };

      if (file.has || file.hasNot) {
        checksToComplete++;
        elementsChecker = elements.init(group);
      }
    }

    if (file.search || file.searchNot) {
      checksToComplete++;
      contentChecker = content.init(group);
    }

    if (!exists.check(fullPath)) {
      markbotMain.send('check-group:item-complete', group, 'exists', 'Exists', [`The file \`${file.path}\` is missing or misspelled`]);
      bypassAllChecks(file);
      checkIfDone();
      return;
    }

    if (file.locked) {
      checksToComplete++;
      markbotMain.send('check-group:item-new', group, 'unchanged', 'Unchanged');

      if (isCheater) {
        markbotMain.send('check-group:item-complete', group, 'unchanged', 'Unchanged', [`The \`${file.path}\` should not be changed`]);
      } else {
        markbotMain.send('check-group:item-complete', group, 'unchanged', 'Unchanged');
      }

      checkIfDone();
    }

    fs.readFile(fullPath, 'utf8', function (err, fileContents) {
      var lines;

      if (fileContents.trim() == '') {
        markbotMain.send('check-group:item-complete', group, 'exists', 'Exists', [`The file \`${file.path}\` is empty`]);
        bypassAllChecks(file);
        checkIfDone();
        return;
      }

      markbotMain.send('check-group:item-complete', group, 'exists', 'Exists');
      checkIfDone();
      lines = fileContents.toString().split(/[\n\u0085\u2028\u2029]|\r\n?/g);

      if (file.valid) {
        validationChecker.check(fullPath, fileContents, lines, function (err) {
          if (!err || err.length <= 0) {
            checkIfDone();

            if (file.bestPractices) bestPracticesChecker.check(fileContents, lines, checkIfDone);
            if (file.outline) outlineChecker.check(fileContents, checkIfDone);

            if (file.has || file.hasNot) {
              if (file.has && !file.hasNot) elementsChecker.check(fileContents, file.has, [], checkIfDone);
              if (!file.has && file.hasNot) elementsChecker.check(fileContents, [], file.hasNot, checkIfDone);
              if (file.has && file.hasNot) elementsChecker.check(fileContents, file.has, file.hasNot, checkIfDone);
            }
          } else {
            if (file.bestPractices) {
              bestPracticesChecker.bypass();
              checksToComplete--;
            }

            if (file.outline) {
              outlineChecker.bypass();
              checksToComplete--;
            }

            if (file.has || file.hasNot) {
              elementsChecker.bypass();
              checksToComplete--;
            }

            checkIfDone();
          }
        });
      }

      if (file.search || file.searchNot) {
        if (file.search && !file.searchNot) contentChecker.check(fileContents, file.search, [], checkIfDone);
        if (!file.search && file.searchNot) contentChecker.check(fileContents, [], file.searchNot, checkIfDone);
        if (file.search && file.searchNot) contentChecker.check(fileContents, file.search, file.searchNot, checkIfDone);
      }
    });
  };

  check();
}());
