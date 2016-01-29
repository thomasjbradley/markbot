'use strict';

var
  util = require('util'),
  path = require('path'),
  exec = require('child_process').exec,
  listener,
  checkGroup,
  checkId = 'validation',
  checkLabel = 'Validation'
;

const escapeShell = function (cmd) {
  return '"' + cmd.replace(/(["'$`\\])/g, '\\$1') + '"';
};

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

module.exports.init = function (lstnr, group) {
  listener = lstnr;
  checkGroup = group;

  listener.send('check-group:item-new', checkGroup, checkId, checkLabel);
};

module.exports.check = function (listener, fullPath, fullContent, lines, cb) {
  var
    validatorPath = path.resolve(__dirname + '/../../vendor'),
    execPath = 'java -jar ' + escapeShell(validatorPath + '/vnu.jar') + ' --errors-only --format json ' + escapeShell(fullPath)
  ;

  listener.send('check-group:item-computing', checkGroup, checkId);

  exec(execPath, function (err, data) {
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

    listener.send('check-group:item-complete', checkGroup, checkId, checkLabel, errors);
    cb(errors);
  });
};
