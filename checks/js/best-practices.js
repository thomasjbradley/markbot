'use strict';

var
  util = require('util'),
  linter = require('eslint').linter,
  linterConfig = require('./best-practices/eslint.json'),
  listener,
  checkGroup,
  checkLabel = 'Best practices & indentation',
  checkId = 'best-practices'
;

module.exports.init = function (lstnr, group) {
  listener = lstnr;
  checkGroup = group;

  listener.send('check-group:item-new', checkGroup, checkId, checkLabel);
};

module.exports.bypass = function () {
  listener.send('check-group:item-bypass', checkGroup, checkId, checkLabel, ['Skipped because of previous errors']);
};

module.exports.check = function (fullPath, fileContents, lines) {
  var
    messages = {},
    errors = []
  ;

  listener.send('check-group:item-computing', checkGroup, checkId);
  messages = linter.verify(fileContents, linterConfig);

  if (messages) {
    messages.forEach(function (item) {
      errors.push(util.format('Line %d: %s', item.line, item.message.replace(/\.$/, '')));
    });
  }

  listener.send('check-group:item-complete', checkGroup, checkId, checkLabel, errors);
};
