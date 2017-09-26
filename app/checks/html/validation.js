'use strict';

const util = require('util');
const path = require('path');
const exec = require('child_process').exec;
const escapeShell = require(`${__dirname}/../../escape-shell`);
const markbotMain = require('electron').remote.require('./app/markbot-main');
const serverManager = require('electron').remote.require('./app/server-manager');

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
  const validatorPath = path.resolve(__dirname.replace(/app.asar[\/\\]/, 'app.asar.unpacked/') + '/../../../vendor/html-validator');
  const hostInfo = serverManager.getHostInfo('html');
  const execPath = `java -Dnu.validator.client.port=${hostInfo.port} -Dnu.validator.client.charset=utf-8 -Dnu.validator.client.level=error -Dnu.validator.client.out=json -cp ` + escapeShell(validatorPath + '/vnu.jar') + ' nu.validator.client.HttpClient ' + escapeShell(fullPath);

  markbotMain.debug(`@@${validatorPath}@@`);
  markbotMain.debug(`\`${execPath}\``);
  markbotMain.send('check-group:item-computing', checkGroup, checkId);

  exec(execPath, function (err, data) {
    const crashMessage = 'Unable to connect to the HTML validator; the background process may have crashed. Please quit & restart Markbot.';
    let messages = {};
    let errors = [];

    if (data) {
      if (/^error\:.+stopping/i.test(data.trim())) {
        errors.push(crashMessage);
        markbotMain.send('check-group:item-complete', checkGroup, checkId, checkLabel, errors);
        markbotMain.send('restart', crashMessage);
        return next(errors);
      }

      try {
        messages = JSON.parse(data);
      } catch (e) {
        markbotMain.debug('Error parsing the HTML validator JSON response');
      }

      if (messages.messages) {
        messages.messages.forEach(function (item) {
          if (shouldIncludeError(item.message, item.line)) {
            errors.push(util.format('Line %d: %s', item.lastLine, item.message.replace(/“/g, '`').replace(/”/g, '`')));
          }
        });
      }

      markbotMain.send('check-group:item-complete', checkGroup, checkId, checkLabel, errors);
      return next(errors);
    } else {
      errors.push(crashMessage);
      markbotMain.send('check-group:item-complete', checkGroup, checkId, checkLabel, errors);
      markbotMain.send('restart', crashMessage);
      return next(errors);
    }
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
