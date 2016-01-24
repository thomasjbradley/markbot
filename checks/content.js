'use strict';

var
  util = require('util')
;

module.exports.check = function (fileContents, regexes, group, cb) {
  var errors = [];

  cb('content', group, 'start', 'Expected content');

  regexes.forEach(function (regex) {
    if (!fileContents.match(new RegExp(regex, 'gm'))) {
      errors.push(util.format('Expected to see this content: “%s”', regex));
    }
  });

  cb('content', group, 'end', 'Expected content', errors);
};
