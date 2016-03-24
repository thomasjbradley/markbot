'use strict';

var
  path = require('path'),
  util = require('util'),
  exec = require('child_process').exec,
  xmlParser = require('xml2js').parseString,
  svgCssProps = require('./validation/svg-css-props.json')
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

const shouldIncludeError = function (message, line, lines, fileContents) {
  var nonExistingPropMatch = null;

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

  // Works around validator's calc() bug
  if (message.match(/value error.*parse error/i)) return false;

  if (message.match(/parse error/i)) {
    // Another work around for validator's calc() bug
    // It's really grabby and will sometimes ignore other errors,
    //   those are hopefully caught by the best practices test
    let currentLine = line;
    let foundOpenBrace = false;

    if (lines[line].match(/calc/) || (lines[line - 1] && lines[line - 1].match(/calc/))) return false;

    while (currentLine >= 0) {
      if (lines[currentLine].match(/calc/)) return false;
      if (lines[currentLine].match(/\{/) && foundOpenBrace) break;
      if (lines[currentLine].match(/\{/)) foundOpenBrace = true;
      currentLine--;
    }

    // Work around for validator's attr() bug
    if ((lines[line - 1] && lines[line - 1].match(/attr/)) || (lines[line - 2] && lines[line - 2].match(/attr/))) {
      return false;
    }

    // This also works around some weird attr() bugs, it's really hinky, don't trust it
    if(lines[line - 1] && lines[line - 1] == '}' && fileContents.match(/attr/)) {
      return false
    }
  }

  // SVG properties in CSS
  nonExistingPropMatch = message.match(/Property ([\w-]+) doesn't exist./);

  if (
    nonExistingPropMatch
    && nonExistingPropMatch.length > 1
    && svgCssProps.indexOf(nonExistingPropMatch[1]) != -1
  ) {
    return false;
  }

  return true;
};

const bypass = function (listener, checkGroup, checkId, checkLabel) {
  listener.send('check-group:item-bypass', checkGroup, checkId, checkLabel, ['Skipped because of previous errors']);
};

const check = function (listener, checkGroup, checkId, checkLabel, fullPath, fileContents, lines, cb) {
  var
    validatorPath = path.resolve(__dirname.replace(/app.asar[\/\\]/, 'app.asar.unpacked/') + '/../../../vendor'),
    execPath = 'java -jar ' + escapeShell(validatorPath + '/css-validator.jar') + ' --output=soap12 ' + escapeShell('file://' + convertToUrl(fullPath))
  ;

  listener.send('check-group:item-computing', checkGroup, checkId);
  listener.send('debug', validatorPath);
  listener.send('debug', execPath);

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
            message = error['m:message'][0].trim().replace(/\s*\:$/, '.')
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
