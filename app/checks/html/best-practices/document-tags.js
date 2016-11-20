'use strict';

module.exports.check = function (fileContents, lines) {
  let errors = [];
  let check;
  let checks = {
    '<html': 'Opening `<html>` tag',
    '<head(?!er)': 'Opening `<head>` tag',
    '</head>': 'Closing `</head>` tag',
    '<body': 'Opening `<body>` tag',
    '</body>': 'Closing `</body>` tag',
    '</html>': 'Closing `</html>` tag',
  };

  for (check in checks) {
    if (!fileContents.match(new RegExp(check, 'gim'))) {
      errors.push(`Missing tag: ${checks[check]}`);
    }
  }

  return errors;
};
