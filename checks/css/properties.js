'use strict';

var
  util = require('util'),
  css = require('css')
;

module.exports.check = function (fileContents, sels, group, cb) {
  var
    code = {},
    errors = [],
    totalTests = sels.length,
    rules = [],
    decs = []
  ;

  cb('properties', group, 'start', 'Required properties');

  code = css.parse(fileContents);

  for (var i = 0; i < totalTests; i++) {
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

  cb('properties', group, 'end', 'Required properties', errors);
};
