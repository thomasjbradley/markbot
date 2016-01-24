'use strict';

var
  util = require('util'),
  validator = require('w3cjs')
;

const shouldIncludeError = function (message, line) {
  // The standard info: using HTML parser
  if (!line && message.match(/content-type.*text\/html/i)) return false;

  // The schema message
  if (!line && message.match(/schema.*html/i)) return false;

  // Google fonts validation error with vertical pipes
  if (message.match(/bad value.*fonts.*google.*\|/i)) return false;

  // Elements that "don't need" specific roles
  if (message.match(/element.*does not need.*role/i)) return false;

  return true;
};

module.exports.check = function (fileContents, group, cb) {
  cb('validation', group, 'start', 'Validation');

  validator.validate({
    input: fileContents,
    callback: function (res) {
      var errors = [];

      if (res.messages.length > 2) {
        res.messages.forEach(function (item) {
          if (shouldIncludeError(item.message, item.line)) {
            errors.push(util.format('Line %d: %s', item.lastLine, item.message));
          }
        });
      }

      cb('validation', group, 'end', 'Validation', errors);
    }
  });
};
