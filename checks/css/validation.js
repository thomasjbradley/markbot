var
  path = require('path'),
  util = require('util'),
  exec = require('child_process').exec,
  xmlParser = require('xml2js').parseString,
  previousLineCausedIgnorableError = false
;

const cleanMessage = function (message) {
  message = message.replace(/\s+/g, ' ');
  return message;
};

const shouldIncludeError = function (message, line, lines) {
  var
    svgCssProps = [
      'alignment-baseline', 'baseline-shift', 'clip', 'clip-path', 'clip-rule', 'color-interpolation',
      'color-interpolation-filters', 'color-profile', 'color-rendering', 'dominant-baseline',
      'enable-background', 'fill', 'fill-opacity', 'fill-rule', 'filter', 'flood-color',
      'flood-opacity', 'glyph-orientation-horizontal', 'glyph-orientation-vertical', 'image-rendering',
      'kerning', 'lighting-color', 'marker', 'marker-end', 'marker-mid', 'marker-start',
      'mask', 'pointer-events', 'shape-rendering', 'stop-color', 'stop-opacity', 'stroke',
      'stroke-dasharray', 'stroke-dashoffset', 'stroke-linecap', 'stroke-linejoin',
      'stroke-miterlimit', 'stroke-opacity', 'stroke-width', 'text-anchor', 'unicode-bidi',
    ],
    nonExistingPropMatch = null
  ;

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

module.exports.check = function (fullContent, fullPath, lines, group, cb) {
  var
    validatorPath = path.resolve(__dirname + '/../../vendor'),
    execPath = 'java -jar "' + validatorPath + '/css-validator.jar" --output=soap12 "file://' + fullPath + '"'
  ;

  cb('validation', group, 'start', 'Validation');

  exec(execPath, function (err, data) {
    var xml = data.trim().replace(/^\{.*\}/, '').trim();

    xmlParser(xml, function (err, result) {
      var
        results = result['env:Envelope']['env:Body'][0]['m:cssvalidationresponse'][0]['m:result'][0]['m:errors'][0],
        errorCount = parseInt(results['m:errorcount'][0], 10),
        errorsList = results['m:errorlist'][0]['m:error'],
        errors = [],
        prevError = false
      ;

      if (errorCount > 0) {
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

      cb('validation', group, 'end', 'Validation', errors);
    });
  });
};
