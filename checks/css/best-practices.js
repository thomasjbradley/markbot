'use strict';

var
  util = require('util'),
  linter = require('stylelint')
;

const bypass = function (listener, checkGroup, checkId, checkLabel) {
  listener.send('check-group:item-bypass', checkGroup, checkId, checkLabel, ['Skipped because of previous errors']);
};

const check = function (listener, checkGroup, checkId, checkLabel, fileContents, lines) {
  listener.send('check-group:item-computing', checkGroup, checkId);

  linter.lint({code: fileContents, config: require('./stylelint.json')}).then(function (data) {
    var errors = [];

    if (data.results) {
      data.results[0].warnings.forEach(function (item) {
        errors.push(util.format('Line %d: %s', item.line, item.text));
      });
    }

    listener.send('check-group:item-complete', checkGroup, checkId, checkLabel, errors);
  });
};

module.exports.init = function (lstnr, group) {
  return (function (l, g) {
    let
      listener = l,
      checkGroup = g,
      checkLabel = 'Best practices & indentation',
      checkId = 'best-practices'
    ;

    listener.send('check-group:item-new', checkGroup, checkId, checkLabel);

    return {
      check: function (fileContents, lines) {
        check(listener, checkGroup, checkId, checkLabel, fileContents, lines);
      },
      bypass: function () {
        bypass(listener, checkGroup, checkId, checkLabel);
      }
    };
  }(lstnr, group));
};
