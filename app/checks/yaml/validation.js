'use strict';

const path = require('path');
const util = require('util');
const yaml = require('js-yaml');
const S = require('string');
const markbotMain = require('electron').remote.require('./app/markbot-main');

const bypass = function (checkGroup, checkId, checkLabel) {
  markbotMain.send('check-group:item-bypass', checkGroup, checkId, checkLabel, ['Skipped because of previous errors']);
};

const check = function (checkGroup, checkId, checkLabel, fullPath, fileContents, next) {
  let filename = path.parse(fullPath).base;
  let yamlData;
  let errors = [];

  markbotMain.send('check-group:item-computing', checkGroup, checkId);

  try {
    yamlData = yaml.safeLoad(fileContents);
  } catch (e) {
    if (e.reason && e.mark) {
      let line = e.mark.line + 1;
      let reason = S(e.reason).humanize();

      errors.push(`Line ${line}: ${reason}`);
    } else {
      let reason = (e.reason) ? ' — ' + S(e.reason).humanize() : '';

      errors.push(`There was a validation error in the YAML data${reason}`);
    }
  }

  markbotMain.send('check-group:item-complete', checkGroup, checkId, checkLabel, errors);
  next(errors);
};

module.exports.init = function (group) {
  return (function (g) {
    const checkGroup = g;
    const checkId = 'validation';
    const checkLabel = 'Validation & best practices';

    markbotMain.send('check-group:item-new', checkGroup, checkId, checkLabel);

    return {
      check: function (fullPath, fileContents, next) {
        check(checkGroup, checkId, checkLabel, fullPath, fileContents, next);
      },
      bypass: function () {
        bypass(checkGroup, checkId, checkLabel);
      }
    };
  }(group));
};
