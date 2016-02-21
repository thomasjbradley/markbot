'use strict';

var
  util = require('util'),
  css = require('css')
;

const bypass = function (listener, checkGroup, checkId, checkLabel) {
  listener.send('check-group:item-bypass', checkGroup, checkId, checkLabel, ['Skipped because of previous errors']);
};

const checkHasProperties = function (code, sels) {
  let
    errors = [],
    i = 0,
    totalTests = sels.length,
    rules = [],
    decs = []
  ;

  if (totalTests == 0) return errors;

  for (i = 0; i < totalTests; i++) {
    rules = code.stylesheet.rules.filter(function (obj) {
      if (!obj.selectors) return false;
      return obj.selectors[0] == sels[i][0];
    });

    if (!rules || rules.length <= 0) {
      errors.push(util.format('Expected to see the `%s` selector', sels[i][0]));
      continue;
    }

    if (rules && sels[i].length == 1) continue;

    decs = rules[0].declarations.filter(function (obj) {
      if (!obj.property) return false;
      return obj.property == sels[i][1];
    });

    if (!decs || decs.length <= 0) {
      errors.push(util.format('Expected to see `%s` inside `%s {}`', sels[i][1], sels[i][0]));
      continue;
    }

    if (decs && sels[i].length == 2) continue;

    if (decs[0].value != sels[i][2]) {
      errors.push(util.format('Expected to see `%s` with a different value inside `%s {}`', sels[i][1], sels[i][0]));
    }
  }

  return errors;
};

const checkHasNotProperties = function (code, sels) {
  let
    errors = [],
    i = 0,
    totalTests = sels.length,
    rules = [],
    decs = []
  ;

  if (totalTests == 0) return errors;

   for (i = 0; i < totalTests; i++) {
    rules = code.stylesheet.rules.filter(function (obj) {
      if (!obj.selectors) return false;
      return obj.selectors[0] == sels[i][0];
    });

    if (!rules || rules.length <= 0) {
      errors.push(util.format('Expected to see the `%s` selector', sels[i][0]));
      continue;
    }

    if (rules && sels[i].length == 1) continue;

    sels[i][1].forEach(function (prop) {
      decs = rules[0].declarations.filter(function (obj) {
        if (!obj.property) return false;
        return obj.property == prop;
      });

      if (decs && decs.length > 0) {
        errors.push(util.format('The `%s` selector cannot have the `%s` property', sels[i][0], prop));
      }
    });
  }

  return errors;
};

const check = function (listener, checkGroup, checkId, checkLabel, fileContents, hasSels, hasNotSels) {
  var
    code = {},
    errors = []
  ;

  listener.send('check-group:item-computing', checkGroup, checkId);

  code = css.parse(fileContents);
  errors = errors.concat(checkHasProperties(code, hasSels), checkHasNotProperties(code, hasNotSels));

  listener.send('check-group:item-complete', checkGroup, checkId, checkLabel, errors);
};

module.exports.init = function (lstnr, group) {
  return (function (l, g) {
    let
      listener = l,
      checkGroup = g,
      checkLabel = 'Required properties',
      checkId = 'properties'
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
