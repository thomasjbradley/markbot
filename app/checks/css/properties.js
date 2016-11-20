'use strict';

const css = require('css');
const markbotMain = require('electron').remote.require('./app/markbot-main');

const bypass = function (checkGroup, checkId, checkLabel) {
  markbotMain.send('check-group:item-bypass', checkGroup, checkId, checkLabel, ['Skipped because of previous errors']);
};

const checkHasProperties = function (code, sels) {
  let errors = [];
  let i = 0;
  let totalTests = sels.length;
  let rules = [];
  let decs = [];
  let afterError = '';
  let context = '';
  let ruleset = [];

  if (totalTests == 0) return errors;

  for (i = 0; i < totalTests; i++) {
    afterError = '';

    if (sels[i][0].substr(0, 1) === '@') {
      let mq = sels[i].shift().replace(/@/, '');
      let tmpRules = code.stylesheet.rules.filter(function (obj) {
        if (obj.type !== 'media') return false;
        return obj.media.includes(mq);
      });

      if (sels[i].length === 5) afterError = ` — ${sels[i][4]}`;

      if (!tmpRules || tmpRules.length <= 0 || tmpRules[0].rules.length <= 0) {
        errors.push(`Expected to see the \`@${mq}\` media query${afterError}`);
        continue;
      }

      if (sels[i].length <= 0) continue;

      context = ` in the \`${mq}\` media query`;
      ruleset = tmpRules[0].rules;
    } else {
      context = '';
      ruleset = code.stylesheet.rules;
      if (sels[i].length === 4) afterError = ` — ${sels[i][3]}`;
    }

    rules = ruleset.filter(function (obj) {
      if (!obj.selectors) return false;
      return obj.selectors[0] == sels[i][0];
    });

    if (!rules || rules.length <= 0) {
      errors.push(`Expected to see the \`${sels[i][0]}\` selector${context}${afterError}`);
      continue;
    }

    if (rules && sels[i].length == 1) continue;

    decs = rules[0].declarations.filter(function (obj) {
      if (!obj.property) return false;
      return obj.property == sels[i][1];
    });

    if (!decs || decs.length <= 0) {
      errors.push(`Expected to see \`${sels[i][1]}\` inside \`${sels[i][0]} {}\`${context}${afterError}`);
      continue;
    }

    if (decs && sels[i].length <= 2) continue;

    if (decs[0].value != sels[i][2]) {
      errors.push(`Expected to see \`${sels[i][1]}\` with a different value inside \`${sels[i][0]} {}\`${context}${afterError}`);
    }
  }

  return errors;
};

const checkHasNotProperties = function (code, sels) {
  let errors = [];
  let i = 0;
  let totalTests = sels.length;
  let rules = [];
  let decs = [];
  let context = '';
  let afterError = '';
  let ruleset = [];

  if (totalTests == 0) return errors;

  for (i = 0; i < totalTests; i++) {
    afterError = '';

    if (sels[i][0].substr(0, 1) === '@') {
      let mq = sels[i].shift().replace(/@/, '');
      let tmpRules = code.stylesheet.rules.filter(function (obj) {
        if (obj.type !== 'media') return false;
        return obj.media.includes(mq);
      });

      if (!tmpRules || tmpRules.length <= 0 || tmpRules[0].rules.length <= 0) continue;

      if (sels[i].length === 4) afterError = ` — ${sels[i][2]}`;

      if (sels[i].length <= 0) {
        errors.push(`The \`@${mq}\` media query should not be used${afterError}`);
        continue;
      }

      context = ` in the \`${mq}\` media query`;
      ruleset = tmpRules[0].rules;
    } else {
      ruleset = code.stylesheet.rules;
      if (sels[i].length === 3) afterError = ` — ${sels[i][2]}`;
    }

    rules = ruleset.filter(function (obj) {
      if (!obj.selectors) return false;
      return obj.selectors[0] == sels[i][0];
    });

    if (!rules || rules.length <= 0) continue;

    if (rules && sels[i].length == 1) {
      errors.push(`The \`${sels[i][0]}\` selector should not be used${context}${afterError}`);
      continue;
    }

    if (sels[i][1] === false && sels[i][2] && typeof sels[i][2] === 'string') {
      errors.push(`The \`${sels[i][0]}\` selector should not be used${context}${afterError}`);
    } else {
      sels[i][1].forEach(function (prop) {
        decs = rules[0].declarations.filter(function (obj) {
          if (!obj.property) return false;
          return obj.property == prop;
        });

        if (decs && decs.length > 0) {
          errors.push(`The \`${sels[i][0]}\` selector cannot have the \`${prop}\` property${context}${afterError}`);
        }
      });
    }
  }

  return errors;
};

const check = function (checkGroup, checkId, checkLabel, fileContents, hasSels, hasNotSels, next) {
  let code = {};
  let errors = [];

  markbotMain.send('check-group:item-computing', checkGroup, checkId);

  try {
    code = css.parse(fileContents);
    errors = errors.concat(checkHasProperties(code, hasSels), checkHasNotProperties(code, hasNotSels));
    markbotMain.send('check-group:item-complete', checkGroup, checkId, checkLabel, errors);
    next();
  } catch (e) {
    if (e.reason && e.line) {
      errors.push(`Line ${e.line}: ${e.reason}`);
      markbotMain.send('check-group:item-complete', checkGroup, checkId, checkLabel, errors);
      next();
    }
  }
};

module.exports.init = function (group) {
  return (function (g) {
    const checkGroup = g;
    const checkLabel = 'Required properties';
    const checkId = 'properties';

    markbotMain.send('check-group:item-new', checkGroup, checkId, checkLabel);

    return {
      check: function (fileContents, hasSels, hasNotSels, next) {
        check(checkGroup, checkId, checkLabel, fileContents, hasSels, hasNotSels, next);
      },
      bypass: function () {
        bypass(checkGroup, checkId, checkLabel);
      }
    };
  }(group));
};
