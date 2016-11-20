'use strict';

const util = require('util');
const markbotMain = require('../markbot-main');

const cleanRegex = function (regex) {
  return regex.replace(/\\(?!\\)/g, '');
};

const bypass = function (checkGroup, checkId, checkLabel) {
  markbotMain.send('check-group:item-bypass', checkGroup, checkId, checkLabel, ['Skipped because of previous errors']);
};

const findSearchErrors = function (fileContents, search) {
  var errors = [];

  search.forEach(function (regex) {
    let re = regex, error;

    if (typeof regex == 'object') {
      re = regex[0];
      error = regex[1];
    } else {
      error = `Expected to see this content: \`${cleanRegex(regex)}\``;
    }

    if (!fileContents.match(new RegExp(re, 'gm'))) {
      errors.push(error);
    }
  });

  return errors;
};

const findSearchNotErrors = function (fileContents, searchNot) {
  var errors = [];

  searchNot.forEach(function (regex) {
    let re = regex, error;

    if (typeof regex == 'object') {
      re = regex[0];
      error = regex[1];
    } else {
      error = `Unexpected \`${cleanRegex(regex)}\` — \`${cleanRegex(regex)}\` should not be used`;
    }

    if (fileContents.match(new RegExp(re, 'gm'))) {
      errors.push(error);
    }
  });

  return errors;
};

const check = function (checkGroup, checkId, checkLabel, fileContents, search, searchNot, next) {
  var errors = [];

  markbotMain.send('check-group:item-computing', checkGroup, checkId);

  if (search) errors = errors.concat(findSearchErrors(fileContents, search));
  if (searchNot) errors = errors.concat(findSearchNotErrors(fileContents, searchNot));

  markbotMain.send('check-group:item-complete', checkGroup, checkId, checkLabel, errors);
  next();
};

module.exports.init = function (group) {
  return (function (g) {
    let checkGroup = g;
    let checkLabel = 'Expected content';
    let checkId = 'content';

    markbotMain.send('check-group:item-new', checkGroup, checkId, checkLabel);

    return {
      check: function (fileContents, search, searchNot, next) {
        check(checkGroup, checkId, checkLabel, fileContents, search, searchNot, next);
      },
      bypass: function () {
        bypass(checkGroup, checkId, checkLabel);
      }
    };
  }(group));
};
