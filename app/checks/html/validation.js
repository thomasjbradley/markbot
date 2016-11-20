'use strict';

const util = require('util');
const path = require('path');
const exec = require('child_process').exec;
const markbotMain = require('../../markbot-main');

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

const bypass = function (checkGroup, checkId, checkLabel) {
  markbotMain.send('check-group:item-bypass', checkGroup, checkId, checkLabel, ['Skipped because of previous errors']);
};

const check = function (checkGroup, checkId, checkLabel, fullPath, fileContents, lines, next) {
  const validatorPath = path.resolve(__dirname.replace(/app.asar[\/\\]/, 'app.asar.unpacked/') + '/../../../vendor');
  const execPath = 'java -jar ' + escapeShell(validatorPath + '/vnu.jar') + ' --errors-only --format json ' + escapeShell(fullPath);

  markbotMain.debug(`@@${validatorPath}@@`);
  markbotMain.debug(`\`${execPath}\``);
  markbotMain.send('check-group:item-computing', checkGroup, checkId);

  exec(execPath, function (err, data) {
    let messages = {};
    let errorJsonBits = [];
    let errorJson = '';
    let errors = [];

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

    markbotMain.send('check-group:item-complete', checkGroup, checkId, checkLabel, errors);
    next(errors);
  });
};

module.exports.init = function (group) {
  return (function (g) {
    const checkGroup = g;
    const checkId = 'validation';
    const checkLabel = 'Validation';

    markbotMain.send('check-group:item-new', checkGroup, checkId, checkLabel);

    return {
      check: function (fullPath, fileContents, lines, next) {
        check(checkGroup, checkId, checkLabel, fullPath, fileContents, lines, next);
      },
      bypass: function () {
        bypass(checkGroup, checkId, checkLabel);
      }
    };
  }(group));
};
