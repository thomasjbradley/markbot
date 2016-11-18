'use strict';

const path = require('path');
const util = require('util');
const dir = require('node-dir');
const stripPath = require('../strip-path');
const extsBlackList = require('./restrict-file-types/extension-blacklist.json');
const extsBlackListSearch = `(${extsBlackList.join('|')})$`;
const fileBlackList = require('./restrict-file-types/file-blacklist.json');
const fileBlackListSearch = `(${fileBlackList.join('|')})`;
const pathsWhiteList = require('./restrict-file-types/path-whitelist.json');
const pathsWhiteListSearch = `^(${pathsWhiteList.join('|').replace(/\./ig, '\.')})`;
const markbotMain = require('../markbot-main');

module.exports.check = function (filePath, group) {
  const fullPath = path.resolve(filePath);
  const label = 'Restricted files';

  markbotMain.send('check-group:item-new', group, 'file-types', label);
  markbotMain.send('check-group:item-computing', group, 'file-types');

  dir.files(fullPath, function(err, files) {
    let errors = [];

    files.forEach(function (file) {
      const simpleFile = stripPath(file, fullPath);

      if (simpleFile.match(pathsWhiteListSearch)) return;

      if (simpleFile.match(extsBlackListSearch) || simpleFile.match(fileBlackListSearch)) {
        errors.push(`\`${simpleFile}\`: Shouldn’t be inside the repository`);
      }
    });

    markbotMain.send('check-group:item-complete', group, 'file-types', label, errors);
  });
};
