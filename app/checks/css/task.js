(function () {
  'use strict';

  const fs = require('fs');
  const path = require('path');
  const markbotMain = require('electron').remote.require('./app/markbot-main');
  const exists = require(__dirname + '/file-exists');
  const validation = require(__dirname + '/checks/css/validation');
  const bestPractices = require(__dirname + '/checks/css/best-practices');
  const properties = require(__dirname + '/checks/css/properties');
  const content = require(__dirname + '/checks/content');

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
      checksToComplete = 0;

      if (f.valid) validationChecker.bypass();
      if (f.bestPractices) bestPracticesChecker.bypass();
      if (f.has || f.hasNot) propertiesChecker.bypass();
      if (f.search || f.searchNot) contentChecker.bypass();
    };

    checksToComplete++;
    markbotMain.send('check-group:item-new', group, 'exists', 'Exists');

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
    } else {
      if (file.valid) {
        checksToComplete++;
        validationChecker = validation.init(group);

        if (file.bestPractices) {
          checksToComplete++;
          bestPracticesChecker = bestPractices.init(group);
        }

        if (file.has || file.hasNot) {
          checksToComplete++;
          propertiesChecker = properties.init(group);
        }
      }

      if (file.search || file.searchNot) {
        checksToComplete++;
        contentChecker = content.init(group);
      }
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

      if (file.locked) return;

      lines = fileContents.toString().trim().split(/[\n\u0085\u2028\u2029]|\r\n?/g);

      if (file.maxLines) {
        checksToComplete++;
        markbotMain.send('check-group:item-new', group, 'lines', '№ lines');

        if (lines.length > file.maxLines) {
          markbotMain.send('check-group:item-complete', group, 'lines', '№ lines', [`There are more lines of code in \`${file.path}\` than expected (has ${lines.length}, expecting <= ${file.maxLines})`]);
        } else {
          markbotMain.send('check-group:item-complete', group, 'lines', '№ lines');
        }
      }

      if (file.valid) {
        validationChecker.check(fullPath, fileContents, lines, function (err) {
          if (!err || err.length <= 0) {
            checkIfDone();

            if (file.bestPractices) bestPracticesChecker.check(fileContents, lines, checkIfDone);

            if (file.has || file.hasNot) {
              if (file.has && !file.hasNot) propertiesChecker.check(fileContents, file.has, [], checkIfDone);
              if (!file.has && file.hasNot) propertiesChecker.check(fileContents, [], file.hasNot, checkIfDone);
              if (file.has && file.hasNot) propertiesChecker.check(fileContents, file.has, file.hasNot, checkIfDone);
            }
          } else {
            if (file.bestPractices) {
              bestPracticesChecker.bypass();
              checksToComplete--;
            }

            if (file.has || file.hasNot) {
              propertiesChecker.bypass();
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
