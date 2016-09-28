'use strict';

const path = require('path');
const util = require('util');
const exec = require('child_process').exec;
const xmlParser = require('xml2js').parseString;

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

const shouldIncludeError = function (message, line, lines, fileContents) {
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

  return true;
};

const bypass = function (listener, checkGroup, checkId, checkLabel) {
  listener.send('check-group:item-bypass', checkGroup, checkId, checkLabel, ['Skipped because of previous errors']);
};

const check = function (listener, checkGroup, checkId, checkLabel, fullPath, fileContents, lines, cb) {
  var
    validatorPath = path.resolve(__dirname.replace(/app.asar[\/\\]/, 'app.asar.unpacked/') + '/../../../vendor'),
    execPath = 'java -jar ' + escapeShell(validatorPath + '/css-validator.jar') + ' --output=soap12 --profile=css3svg ' + escapeShell('file://' + convertToUrl(fullPath))
  ;

  listener.send('check-group:item-computing', checkGroup, checkId);
  listener.send('debug', `@@${validatorPath}@@`);
  listener.send('debug', `\`${execPath}\``);

  exec(execPath, function (err, data) {
    var xml = data.trim().replace(/^\{.*\}/, '').trim();

    xmlParser(xml, function (err, result) {
      var
        results,
        errorCount,
        errorsList,
        errors = []
      ;

      if (!result) {
        errors.push('There was a problem with the CSS validator — please try again');
        listener.send('check-group:item-complete', checkGroup, checkId, checkLabel, errors);
        cb(errors);
        return;
      }

      results = result['env:Envelope']['env:Body'][0]['m:cssvalidationresponse'][0]['m:result'][0]['m:errors'][0];
      errorCount = parseInt(results['m:errorcount'][0], 10);

      if (errorCount > 0) {
        errorsList = results['m:errorlist'][0]['m:error'];

        errorsList.forEach(function (error) {
          var
            line = error['m:line'][0],
            message = error['m:message'][0].trim().replace(/\s*\:$/, '.').replace(/\(.*?\#.*?\)/, '—')
          ;

          if (shouldIncludeError(message, line, lines, fileContents)) {
            errors.push(util.format('Line %d: %s', line, message));
          }
        });
      }

      listener.send('check-group:item-complete', checkGroup, checkId, checkLabel, errors);
      cb(errors);
    });
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
