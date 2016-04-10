'use strict';

var
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
    decs = [],
    context = '',
    ruleset = []
  ;

  if (totalTests == 0) return errors;

  for (i = 0; i < totalTests; i++) {
    if (sels[i][0].substr(0, 1) === '@') {
      let mq = sels[i].shift().replace(/@/, '');
      let tmpRules = code.stylesheet.rules.filter(function (obj) {
        if (obj.type !== 'media') return false;
        return obj.media.includes(mq);
      });

      if (!tmpRules || tmpRules.length <= 0 || tmpRules[0].rules.length <= 0) {
        errors.push(`Expected to see the \`@${mq}\` media query`);
        continue;
      }

      context = ` in the \`${mq}\` media query`;
      ruleset = tmpRules[0].rules;
    } else {
      ruleset = code.stylesheet.rules;
    }

    rules = ruleset.filter(function (obj) {
      if (!obj.selectors) return false;
      return obj.selectors[0] == sels[i][0];
    });

    if (!rules || rules.length <= 0) {
      errors.push(`Expected to see the \`${sels[i][0]}\` selector${context}`);
      continue;
    }

    if (rules && sels[i].length == 1) continue;

    decs = rules[0].declarations.filter(function (obj) {
      if (!obj.property) return false;
      return obj.property == sels[i][1];
    });

    if (!decs || decs.length <= 0) {
      errors.push(`Expected to see \`${sels[i][1]}\` inside \`${sels[i][0]} {}\`${context}`);
      continue;
    }

    if (decs && sels[i].length == 2) continue;

    if (decs[0].value != sels[i][2]) {
      errors.push(`Expected to see \`${sels[i][1]}\` with a different value inside \`${sels[i][0]} {}\`${context}`);
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
    decs = [],
    context = '',
    ruleset = []
  ;

  if (totalTests == 0) return errors;

  for (i = 0; i < totalTests; i++) {
    if (sels[i][0].substr(0, 1) === '@') {
      let mq = sels[i].shift().replace(/@/, '');
      let tmpRules = code.stylesheet.rules.filter(function (obj) {
        if (obj.type !== 'media') return false;
        return obj.media.includes(mq);
      });

      if (!tmpRules || tmpRules.length <= 0 || tmpRules[0].rules.length <= 0) continue;

      if (sels[i].length <= 0) {
        errors.push(`The \`@${mq}\` media query should not be used`);
        continue;
      }

      context = ` in the \`${mq}\` media query`;
      ruleset = tmpRules[0].rules;
    } else {
      ruleset = code.stylesheet.rules;
    }

    rules = ruleset.filter(function (obj) {
      if (!obj.selectors) return false;
      return obj.selectors[0] == sels[i][0];
    });

    if (!rules || rules.length <= 0) continue;

    if (rules && sels[i].length == 1) {
      errors.push(`The \`${sels[i][0]}\` selector should not be used${context}`);
      continue;
    }

    sels[i][1].forEach(function (prop) {
      decs = rules[0].declarations.filter(function (obj) {
        if (!obj.property) return false;
        return obj.property == prop;
      });

      if (decs && decs.length > 0) {
        errors.push(`The \`${sels[i][0]}\` selector cannot have the \`${prop}\` property${context}`);
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

  try {
    code = css.parse(fileContents);
    errors = errors.concat(checkHasProperties(code, hasSels), checkHasNotProperties(code, hasNotSels));
    listener.send('check-group:item-complete', checkGroup, checkId, checkLabel, errors);
  } catch (e) {
    if (e.reason && e.line) {
      errors.push(`Line ${e.line}: ${e.reason}`);
      listener.send('check-group:item-complete', checkGroup, checkId, checkLabel, errors);
    }
  }
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
