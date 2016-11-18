'use strict';

const util = require('util');
const path = require('path');
const linter = require('eslint').linter;
const linterConfig = require('./validation/eslint.json');
const markbotMain = require('../../markbot-main');

const bypass = function (checkGroup, checkId, checkLabel) {
  markbotMain.send('check-group:item-bypass', checkGroup, checkId, checkLabel, ['Skipped because of previous errors']);
};

const check = function (checkGroup, checkId, checkLabel, fileContents, lines, cb) {
  var
    messages = {},
    errors = []
  ;

  markbotMain.send('check-group:item-computing', checkGroup, checkId);
  messages = linter.verify(fileContents, linterConfig);

  if (messages) {
    messages.forEach(function (item) {
      errors.push(util.format('Line %d: %s', item.line, item.message.replace(/\.$/, '')));
    });
  }

  markbotMain.send('check-group:item-complete', checkGroup, checkId, checkLabel, errors);
  cb(errors);
};

module.exports.init = function (group) {
  return (function (g) {
    const checkGroup = g;
    const checkId = 'validation';
    const checkLabel = 'Validation';

    markbotMain.send('check-group:item-new', checkGroup, checkId, checkLabel);

    return {
      check: function (fileContents, lines, cb) {
        check(checkGroup, checkId, checkLabel, fileContents, lines, cb);
      },
      bypass: function () {
        bypass(checkGroup, checkId, checkLabel);
      }
    };
  }(group));
};
