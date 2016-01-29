'use strict';

var
  util = require('util'),
  listener,
  checkGroup,
  checkLabel = 'Expected content',
  checkId = 'content'
;

module.exports.init = function (lstnr, group) {
  listener = lstnr;
  checkGroup = group;

  listener.send('check-group:item-new', checkGroup, checkId, checkLabel);
};

module.exports.check = function (fileContents, regexes) {
  var errors = [];

  listener.send('check-group:item-computing', checkGroup, checkId);

  regexes.forEach(function (regex) {
    if (!fileContents.match(new RegExp(regex, 'gm'))) {
      errors.push(util.format('Expected to see this content: “%s”', regex));
    }
  });

  listener.send('check-group:item-complete', checkGroup, checkId, checkLabel, errors);
};
