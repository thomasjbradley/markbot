'use strict';

const path = require('path');
const util = require('util');
const dir = require('node-dir');
const stripPath = require('../strip-path');
const extsBlackList = require('./restrict-file-types/extension-blacklist.json');
const extsBlackListSearch = `(${extsBlackList.join('|')})$`;
const fileBlackList = require('./restrict-file-types/file-blacklist.json');
const fileBlackListSearch = `(${fileBlackList.join('|')})`;

module.exports.check = function (listener, filePath, group) {
  const fullPath = path.resolve(filePath);
  const label = 'Restricted files';

  listener.send('check-group:item-new', group, 'file-types', label);
  listener.send('check-group:item-computing', group, 'file-types');

  dir.files(fullPath, function(err, files) {
    let errors = [];

    files.forEach(function (file) {
      if (file.match(extsBlackListSearch) || file.match(fileBlackListSearch)) {
        errors.push(`\`${stripPath(file, fullPath)}\`: Shouldn’t be inside the repository`);
      }
    });

    listener.send('check-group:item-complete', group, 'file-types', label, errors);
  });
};
