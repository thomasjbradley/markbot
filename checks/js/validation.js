'use strict';

var
  util = require('util'),
  path = require('path'),
  exec = require('child_process').exec,
  eslint = require('eslint').linter,
  eslintConfig = require('./validation/eslint.json'),
  listener,
  checkGroup,
  checkId = 'validation',
  checkLabel = 'Validation'
;

const shouldIncludeError = function (message, line) {
  return true;
};

module.exports.init = function (lstnr, group) {
  listener = lstnr;
  checkGroup = group;

  listener.send('check-group:item-new', checkGroup, checkId, checkLabel);
};

module.exports.bypass = function () {
  listener.send('check-group:item-bypass', checkGroup, checkId, checkLabel, ['Skipped because of previous errors']);
};

module.exports.check = function (fullPath, fullContent, lines, cb) {
  var
    messages = {},
    errors = []
  ;

  listener.send('check-group:item-computing', checkGroup, checkId);
  messages = eslint.verify(fullContent, eslintConfig);

  if (messages) {
    messages.forEach(function (item) {
      if (shouldIncludeError(item.message, item.line)) {
        errors.push(util.format('Line %d: %s', item.line, item.message.replace(/\.$/, '')));
      }
    });
  }

  listener.send('check-group:item-complete', checkGroup, checkId, checkLabel, errors);
  cb(errors);
};
