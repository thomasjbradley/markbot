'use strict';

var
  util = require('util'),
  linter = require('stylelint'),
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
