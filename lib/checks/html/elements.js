'use strict';

var
  util = require('util'),
  cheerio = require('cheerio')
;

const bypass = function (listener, checkGroup, checkId, checkLabel) {
  listener.send('check-group:item-bypass', checkGroup, checkId, checkLabel, ['Skipped because of previous errors']);
};

const checkHasElements = function (code, sels) {
  var errors = [];

  sels.forEach(function (sel) {
    let se = sel, error = `Expected to see this element: \`${sel}\``;

    if (typeof sel == 'object') {
      se = sel[0];
      error = sel[1];
    }

    try {
      if (code(se).length <= 0) {
        errors.push(error);
      }
    } catch (e) {
      errors.push(error);
    }
  });

  return errors;
};

const checkHasNotElements = function (code, sels) {
  var errors = [];

  sels.forEach(function (sel) {
    let se = sel, error = `The \`${sel}\` element should not be used`;

    if (typeof sel == 'object') {
      se = sel[0];
      error = sel[1];
    }

    try {
      if (code(se).length > 0) {
        errors.push(error);
      }
    } catch (e) {
      errors.push(error);
    }
  });

  return errors;
};

const check = function (listener, checkGroup, checkId, checkLabel, fileContents, hasSels, hasNotSels) {
  var
    code = {},
    errors = []
  ;

  listener.send('check-group:item-computing', checkGroup, checkId);

  code = cheerio.load(fileContents);
  errors = errors.concat(checkHasElements(code, hasSels), checkHasNotElements(code, hasNotSels));

  listener.send('check-group:item-complete', checkGroup, checkId, checkLabel, errors);
};

module.exports.init = function (lstnr, group) {
  return (function (l, g) {
    let
      listener = l,
      checkGroup = g,
      checkLabel = 'Required elements',
      checkId = 'elements'
    ;

    listener.send('check-group:item-new', checkGroup, checkId, checkLabel);

    return {
      check: function (fileContents, hasSels, hasNotSels) {
        check(listener, checkGroup, checkId, checkLabel, fileContents, hasSels, hasNotSels);
      },
      bypass: function () {
        bypass(listener, checkGroup, checkId, checkLabel);
      }
    };
  }(lstnr, group));
};
