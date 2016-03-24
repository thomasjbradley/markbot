'use strict';

var
  util = require('util')
;

module.exports.check = function (fileContents, lines) {
  var
    errors = [],
    check,
    checks = {
      '<html': 'Opening <html> tag',
      '<head(?!er)': 'Opening <head> tag',
      '</head>': 'Closing <head> tag',
      '<body': 'Opening <body> tag',
      '</body>': 'Closing <body> tag',
      '</html>': 'Closing <html> tag',
    }
  ;

  for (check in checks) {
    if (!fileContents.match(new RegExp(check, 'gim'))) {
      errors.push(util.format('Missing tag: %s', checks[check]));
    }
  }

  return errors;
};
