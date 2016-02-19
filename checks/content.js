'use strict';

var
  util = require('util')
;

const bypass = function (listener, checkGroup, checkId, checkLabel) {
  listener.send('check-group:item-bypass', checkGroup, checkId, checkLabel, ['Skipped because of previous errors']);
};

const check = function (listener, checkGroup, checkId, checkLabel, fileContents, regexes) {
  var errors = [];

  listener.send('check-group:item-computing', checkGroup, checkId);

  regexes.forEach(function (regex) {
    if (!fileContents.match(new RegExp(regex, 'gm'))) {
      errors.push(util.format('Expected to see this content: “%s”', regex));
    }
  });

  listener.send('check-group:item-complete', checkGroup, checkId, checkLabel, errors);
};

module.exports.init = function (lstnr, group) {
  return (function (l, g) {
    let
      listener = l,
      checkGroup = g,
      checkLabel = 'Expected content',
      checkId = 'content'
    ;

    listener.send('check-group:item-new', checkGroup, checkId, checkLabel);

    return {
      check: function (fileContents, regexes) {
        check(listener, checkGroup, checkId, checkLabel, fileContents, regexes);
      },
      bypass: function () {
        bypass(listener, checkGroup, checkId, checkLabel);
      }
    };
  }(lstnr, group));
};
