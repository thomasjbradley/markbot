'use strict';

const path = require('path');
const util = require('util');
const exec = require('child_process').exec;
const xmlParser = require('xml2js').parseString;
const markbotMain = require('electron').remote.require('./app/markbot-main');

/**
 * This function is mainly to work around Windows issues
 * The CSS validator doesn’t accept Windows paths because of back slashes
 *   the path needs to be a valid URL
 */
const convertToUrl = function (path) {
  let urlPath = path.replace(/\\/g, '/');

  if (urlPath[0] !== '/') urlPath = '/' + urlPath;

  return urlPath;
};

const escapeShell = function (cmd) {
  return '"' + cmd.replace(/(["'$`\\])/g, '\\$1') + '"';
};

const cleanMessage = function (message) {
  message = message.replace(/\s+/g, ' ');
  return message;
};

const shouldIncludeError = function (context, message, skippedstring, line, lines, fileContents) {
  var nonExistingPropMatch = null;

  // Parse error at bottom of CSS, usually extra closing brace
  if (line > lines.length - 1) return true;

  // Caused by @viewport
  // It’s a little overzealous: if the viewport is written all on one line, as I tend to do
  //   then validation errors anywhere in that line will be skipped
  //   it relies on the best practices & properties to catch skipped errors
  if (message.match(/parse error/i) && lines[line].match(/viewport/) || (lines[line - 1] && lines[line - 1].match(/viewport/))) return false;
  if (message.match(/at-rule @.*viewport/i)) return false;

  if (message.match(/text-size-adjust/)) return false;
  if (message.match(/text-rendering/)) return false;

  // Vendor prefixes
  if (message.match(/-webkit-/)) return false;
  if (message.match(/-moz-/)) return false;
  if (message.match(/-ms-/)) return false;
  if (message.match(/-o-/)) return false;

  // Touch action
  if (message.match(/property touch-action/i)) return false;

  // Appearance
  if (message.match(/property appearance/i)) return false;

  // Ignore :root variable declarations
  if (context && /\:root/.test(context)) return false;

  // Ignore var() values
  if (skippedstring && /var\(/.test(skippedstring)) return false;

  // Ignore CSS4 form selectors
  if (message && /pseudo.+\:(invalid|valid|required|optional|in-range|out-of-range)/.test(message)) return false;

  return true;
};

const bypass = function (checkGroup, checkId, checkLabel) {
  markbotMain.send('check-group:item-bypass', checkGroup, checkId, checkLabel, ['Skipped because of previous errors']);
};

const check = function (checkGroup, checkId, checkLabel, fullPath, fileContents, lines, next) {
  const validatorPath = path.resolve(__dirname.replace(/app.asar[\/\\]/, 'app.asar.unpacked/') + '/../../../vendor');
  const execPath = 'java -jar ' + escapeShell(validatorPath + '/css-validator.jar') + ' --output=soap12 --profile=css3svg ' + escapeShell('file://' + convertToUrl(fullPath));

  markbotMain.send('check-group:item-computing', checkGroup, checkId);
  markbotMain.debug(`@@${validatorPath}@@`);
  markbotMain.debug(`\`${execPath}\``);

  exec(execPath, function (err, data) {
    var xml = data.trim().replace(/^\{.*\}/, '').trim();

    xmlParser(xml, function (err, result) {
      let results;
      let errorCount;
      let errorsList;
      let errors = [];

      if (!result) {
        errors.push('There was a problem with the CSS validator — please try again');
        markbotMain.send('check-group:item-complete', checkGroup, checkId, checkLabel, errors);
        return next(errors);
      }

      results = result['env:Envelope']['env:Body'][0]['m:cssvalidationresponse'][0]['m:result'][0]['m:errors'][0];
      errorCount = parseInt(results['m:errorcount'][0], 10);

      if (errorCount > 0) {
        errorsList = results['m:errorlist'][0]['m:error'];

        errorsList.forEach(function (error) {
          let context = (error['m:context'] && error['m:context'][0]) ? error['m:context'][0].trim() : false;
          let line = error['m:line'][0];
          let message = error['m:message'][0].trim().replace(/\s*\:$/, '.').replace(/\s*\:/, ':').replace(/\(.*?\#.*?\)/, '—');
          let skippedstring = (error['m:skippedstring'] && error['m:skippedstring'][0]) ? error['m:skippedstring'][0].trim() : false;

          if (shouldIncludeError(context, message, skippedstring, line, lines, fileContents)) {
            let contextMessage = '';
            let skipMessage = '';

            if (context) contextMessage = ` inside the \`${context}\` selector`;
            if (skippedstring) skipMessage = ` around this code: \`${skippedstring}\``;

            errors.push(`Line ${line}: ${message}${contextMessage}${skipMessage}`);
          }
        });
      }

      markbotMain.send('check-group:item-complete', checkGroup, checkId, checkLabel, errors);
      next(errors);
    });
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
