(function () {
  'use strict';

  const path = require('path');
  const listDir = require('./list-dir');
  const stripPath = require('./strip-path');
  const markbotMain = require('electron').remote.require('./app/markbot-main');

  const extsBlackList = require('./checks/naming-conventions/extension-blacklist.json');
  const extsBlackListSearch = `(${extsBlackList.join('|')})$`;
  const fileBlackList = require('./checks/naming-conventions/file-blacklist.json');
  const fileBlackListSearch = `(${fileBlackList.join('|')})`;
  const pathsWhiteList = require('./checks/naming-conventions/path-whitelist.json');
  const pathsWhiteListSearch = `^(${pathsWhiteList.join('|').replace(/\./ig, '\.')})`;

  const fullPath = path.resolve(taskDetails.cwd);

  const checkNaming = function (file) {
    const cleanFile = stripPath(file, fullPath);
    let errors = [];

    if (cleanFile !== cleanFile.replace(/[^a-z0-9\-\.\/\\]/g, '')) {
      errors.push(`\`${cleanFile.replace(/\\/, '/')}\`: Doesn’t follow naming conventions`);
    }

    return errors;
  };

  const checkRestrictedFiles = function (file) {
    const cleanFile = stripPath(file, fullPath);
    let errors = [];

    if (cleanFile.match(pathsWhiteListSearch)) return;

    if (cleanFile.match(extsBlackListSearch) || cleanFile.match(fileBlackListSearch)) {
      errors.push(`\`${cleanFile}\`: Shouldn’t be inside the repository`);
    }

    return errors;
  };

  const namingLabel = 'Consistent naming';
  const restrictedLabel = 'Restricted files';

  if (taskDetails.options.naming) {
    markbotMain.send('check-group:item-new', taskDetails.group, 'naming', namingLabel);
    markbotMain.send('check-group:item-computing', taskDetails.group, 'naming');
  }

  if (taskDetails.options.restrictFileTypes) {
    markbotMain.send('check-group:item-new', taskDetails.group, 'file-types', restrictedLabel);
    markbotMain.send('check-group:item-computing', taskDetails.group, 'file-types');
  }

  listDir(fullPath, function(files) {
    let namingErrors = [];
    let restrictedErrors = [];

    files.forEach(function (file) {
      if (taskDetails.options.naming) namingErrors = namingErrors.concat(checkNaming(file));
      if (taskDetails.options.restrictFileTypes) restrictedErrors = restrictedErrors.concat(checkRestrictedFiles(file));
    });

    if (taskDetails.options.naming) markbotMain.send('check-group:item-complete', taskDetails.group, 'naming', namingLabel, namingErrors);
    if (taskDetails.options.restrictFileTypes) markbotMain.send('check-group:item-complete', taskDetails.group, 'file-types', restrictedLabel, restrictedErrors);

    done();
  });
}());
