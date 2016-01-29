'use strict';

var
  util = require('util')
;

module.exports.check = function (fileContents, lines) {
  var
    errors = [],
    check,
    checks = {
      '<html': 'Open <html> tag',
      '<head(?!er)': 'Open <head> tag',
      '</head>': 'Close <head> tag',
      '<body': 'Open <body> tag',
      '</body>': 'Close <body> tag',
      '</html>': 'Close <html> tag',
    }
  ;

  for (check in checks) {
    if (!fileContents.match(new RegExp(check, 'gim'))) {
      errors.push(util.format('Missing tag: %s.', checks[check]));
    }
  }

  return errors;
};
