'use strict';

var
  util = require('util'),
  path = require('path'),
  exec = require('child_process').exec
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

const bypass = function (listener, checkGroup, checkId, checkLabel) {
  listener.send('check-group:item-bypass', checkGroup, checkId, checkLabel, ['Skipped because of previous errors']);
};

const check = function (listener, checkGroup, checkId, checkLabel, fullPath, fileContents, lines, cb) {
  var
    validatorPath = path.resolve(__dirname.replace(/app.asar[\/\\]/, 'app.asar.unpacked/') + '/../../../vendor'),
    execPath = 'java -jar ' + escapeShell(validatorPath + '/vnu.jar') + ' --errors-only --format json ' + escapeShell(fullPath)
  ;

  listener.send('debug', `@@${validatorPath}@@`);
  listener.send('debug', execPath);
  listener.send('check-group:item-computing', checkGroup, checkId);

  exec(execPath, function (err, data) {
    var
      messages = {},
      errorJsonBits = [],
      errorJson = '',
      errors = []
    ;

    if (err && err.message && typeof err.message == 'string') {
      errorJsonBits = err.message.trim().split(/[\n\u0085\u2028\u2029]|\r\n?/g);

      if (errorJsonBits[1]) errorJson = errorJsonBits[1].trim();
      if (errorJson) messages = JSON.parse(errorJson);

      if (errorJson && messages.messages) {
        messages.messages.forEach(function (item) {
          if (shouldIncludeError(item.message, item.line)) {
            errors.push(util.format('Line %d: %s', item.lastLine, item.message.replace(/“/g, '`').replace(/”/g, '`')));
          }
        });
      }
    }

    listener.send('check-group:item-complete', checkGroup, checkId, checkLabel, errors);
    cb(errors);
  });
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
      check: function (fullPath, fileContents, lines, cb) {
        check(listener, checkGroup, checkId, checkLabel, fullPath, fileContents, lines, cb);
      },
      bypass: function () {
        bypass(listener, checkGroup, checkId, checkLabel);
      }
    };
  }(lstnr, group));
};
