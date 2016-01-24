var
  util = require('util'),
  validator = require('w3c-css'),
  previousLineCausedIgnorableError = false
;

const cleanMessage = function (message) {
  message = message.replace(/\s+/g, ' ');
  return message;
};

const shouldIncludeError = function (message, line, lines) {
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

  return true;
};

module.exports.check = function (fileContents, lines, group, cb) {
  cb('validation', group, 'start', 'Validation');

  validator.validate({text: fileContents, warning: 'no'}, function (err, data) {
    var errors = [];

    if (data.errors && data.errors.length > 0) {
      data.errors.forEach(function (item) {
        var message = cleanMessage(item.message);

        if (shouldIncludeError(message, item.line, lines)) {
          errors.push(util.format('Line %d: %s', item.line, message));
        }
      });

      // setTimeout(function () {
      cb('validation', group, 'end', 'Validation', errors);
      // }, 2000);
    }
  });
};
