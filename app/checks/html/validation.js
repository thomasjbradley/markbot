'use strict';

const util = require('util');
const path = require('path');
const http = require('http');
const exec = require('child_process').exec;
const escapeShell = require(`${__dirname}/../../escape-shell`);
const markbotMain = require('electron').remote.require('./app/markbot-main');
const serverManager = require('electron').remote.require('./app/server-manager');
const userAgentService = require(`${__dirname}/../../user-agent-service`);

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
  const crashMessage = 'Unable to connect to the HTML validator; the background process may have crashed. Please quit & restart Markbot.';
  let messages = {};
  let errors = [];

  const requestOpts = {
    hostname: hostInfo.hostname,
    port: hostInfo.port,
    path: '/?out=json&level=error&parser=html5',
    method: 'POST',
    protocol: `${hostInfo.protocol}:`,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Length': Buffer.byteLength(fileContents),
      'User-Agent': userAgentService.get(),
    }
  };

  const req = http.request(requestOpts, (res) => {
    res.setEncoding('utf8');
    res.on('data', (data) => {
      if (data) {
        try {
          messages = JSON.parse(data);
        } catch (e) {
          errors.push(crashMessage);
          markbotMain.send('check-group:item-complete', checkGroup, checkId, checkLabel, errors);
          markbotMain.send('restart', crashMessage);
          return next(errors);
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
        // Error: getaddrinfo ENOTFOUND
        // Debugging tip:
        // - Check localhost has a loop-back resolver pointing to 127.0.0.1
        // - /etc/hosts
        errors.push(crashMessage);
        markbotMain.send('check-group:item-complete', checkGroup, checkId, checkLabel, errors);
        markbotMain.send('restart', crashMessage);
        return next(errors);
      }
    });
  });

  req.on('error', () => {
    errors.push(crashMessage);
    markbotMain.send('check-group:item-complete', checkGroup, checkId, checkLabel, errors);
    markbotMain.send('restart', crashMessage);
    return next(errors);
  });

  markbotMain.debug(`@@${validatorPath}@@`);
  markbotMain.send('check-group:item-computing', checkGroup, checkId);

  req.end(fileContents, 'utf8');
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
