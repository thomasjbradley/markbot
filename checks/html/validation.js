'use strict';

var
  util = require('util'),
  path = require('path'),
  exec = require('child_process').exec
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

module.exports.check = function (fileContents, fullPath, group, cb) {
  var validatorPath = path.resolve(__dirname + '/../../vendor');

  cb('validation', group, 'start', 'Validation');

  exec('java -jar ' + validatorPath + '/vnu.jar --errors-only --format json ' + fullPath, function (err, data) {
    var
      messages = {},
      errors = []
    ;

    if (err) {
      messages = JSON.parse(err.message.split('\n')[1].trim()).messages;

      messages.forEach(function (item) {
        if (shouldIncludeError(item.message, item.line)) {
          errors.push(util.format('Line %d: %s', item.lastLine, item.message));
        }
      });
    }

    cb('validation', group, 'end', 'Validation', errors);
  });
};
