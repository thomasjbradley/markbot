'use strict';

var
  util = require('util'),
  path = require('path'),
  linter = require('eslint').linter,
  linterConfig = require('./validation/eslint.json')
;

const bypass = function (listener, checkGroup, checkId, checkLabel) {
  listener.send('check-group:item-bypass', checkGroup, checkId, checkLabel, ['Skipped because of previous errors']);
};

const check = function (listener, checkGroup, checkId, checkLabel, fileContents, lines, cb) {
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
  cb(errors);
};

module.exports.init = function (lstnr, group) {
  return (function (l, g) {
    let
      listener = l,
      checkGroup = g,
      checkId = 'validation',
      checkLabel = 'Validation'
    ;

    listener.send('check-group:item-new', checkGroup, checkId, checkLabel);

    return {
      check: function (fileContents, lines, cb) {
        check(listener, checkGroup, checkId, checkLabel, fileContents, lines, cb);
      },
      bypass: function () {
        bypass(listener, checkGroup, checkId, checkLabel);
      }
    };
  }(lstnr, group));
};
