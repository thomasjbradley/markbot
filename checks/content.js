'use strict';

var
  util = require('util')
;

const bypass = function (listener, checkGroup, checkId, checkLabel) {
  listener.send('check-group:item-bypass', checkGroup, checkId, checkLabel, ['Skipped because of previous errors']);
};

const findSearchErrors = function (fileContents, search) {
  var errors = [];

  search.forEach(function (regex) {
    let re = regex, error = `Expected to see this content: “${regex}”`;

    if (typeof regex == 'object') {
      re = regex[0];
      error = regex[1];
    }

    if (!fileContents.match(new RegExp(re, 'gm'))) {
      errors.push(error);
    }
  });

  return errors;
};

const findSearchNotErrors = function (fileContents, searchNot) {
  var errors = [];

  searchNot.forEach(function (regex) {
    let re = regex, error = `Unexpected “${regex}” — “${regex}” should not be used`;

    if (typeof regex == 'object') {
      re = regex[0];
      error = regex[1];
    }

    if (fileContents.match(new RegExp(re, 'gm'))) {
      errors.push(error);
    }
  });

  return errors;
};

const check = function (listener, checkGroup, checkId, checkLabel, fileContents, search, searchNot) {
  var errors = [];

  listener.send('check-group:item-computing', checkGroup, checkId);

  if (search) errors = errors.concat(findSearchErrors(fileContents, search));
  if (searchNot) errors = errors.concat(findSearchNotErrors(fileContents, searchNot));

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
      check: function (fileContents, search, searchNot) {
        check(listener, checkGroup, checkId, checkLabel, fileContents, search, searchNot);
      },
      bypass: function () {
        bypass(listener, checkGroup, checkId, checkLabel);
      }
    };
  }(lstnr, group));
};
