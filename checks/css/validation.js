'use strict';

var
  path = require('path'),
  util = require('util'),
  exec = require('child_process').exec,
  xmlParser = require('xml2js').parseString,
  svgCssProps = require('./validation/svg-css-props.json'),
  previousLineCausedIgnorableError = false,
  listener,
  checkGroup,
  checkId = 'validation',
  checkLabel = 'Validation'
;

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

const shouldIncludeError = function (message, line, lines) {
  var nonExistingPropMatch = null;

  if (previousLineCausedIgnorableError) {
    previousLineCausedIgnorableError = false;
    return false;
  }

  // Caused by @viewport
  if (message == 'Parse Error' && line == 1) return false;
  if (message.match(/at-rule @.*viewport/i)) return false;

  if (message.match(/text-size-adjust/i)) return false;

  // Works around validator's calc() bug
  if (message.match(/value error.*parse error/i)) return false;

  if (message.match(/parse error/i)) {
    // Another work around for validator's calc() bug
    if (lines[line - 1].match(/calc/)) {
      previousLineCausedIgnorableError = true;
      return false;
    }
  }

  // SVG properties in CSS
  nonExistingPropMatch = message.match(/Property ([\w-]+) doesn't exist./);

  if (nonExistingPropMatch && nonExistingPropMatch.length > 1 && svgCssProps.indexOf(nonExistingPropMatch[1]) != -1) return false;

  return true;
};

module.exports.init = function (lstnr, group) {
  listener = lstnr;
  checkGroup = group;

  listener.send('check-group:item-new', checkGroup, checkId, checkLabel);
};

module.exports.bypass = function () {
  listener.send('check-group:item-bypass', checkGroup, checkId, checkLabel, ['Skipped because of previous errors']);
};

module.exports.check = function (fullPath, fullContent, lines, cb) {
  var
    validatorPath = path.resolve(__dirname + '/../../vendor'),
    execPath = 'java -jar ' + escapeShell(validatorPath + '/css-validator.jar') + ' --output=soap12 ' + escapeShell('file://' + convertToUrl(fullPath))
  ;

  listener.send('check-group:item-computing', checkGroup, checkId);

  exec(execPath, function (err, data) {
    var xml = data.trim().replace(/^\{.*\}/, '').trim();

    xmlParser(xml, function (err, result) {
      var
        results = result['env:Envelope']['env:Body'][0]['m:cssvalidationresponse'][0]['m:result'][0]['m:errors'][0],
        errorCount = parseInt(results['m:errorcount'][0], 10),
        errorsList,
        errors = [],
        prevError = false
      ;

      if (errorCount > 0) {
        errorsList = results['m:errorlist'][0]['m:error'];

        errorsList.forEach(function (error) {
          var
            line = error['m:line'][0],
            message = error['m:message'][0].trim().replace(/\s*\:$/, '.')
          ;

          if (shouldIncludeError(message, line, lines)) {
            errors.push(util.format('Line %d: %s', line, message));
          }

          prevError = message;
        });
      }

      listener.send('check-group:item-complete', checkGroup, checkId, checkLabel, errors);
      cb(errors);
    });
  });
};
