'use strict';

const util = require('util');
const cheerio = require('cheerio');
const markbotMain = require('electron').remote.require('./app/markbot-main');

const bypass = function (checkGroup, checkId, checkLabel) {
  markbotMain.send('check-group:item-bypass', checkGroup, checkId, checkLabel, ['Skipped because of previous errors']);
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

const check = function (checkGroup, checkId, checkLabel, fileContents, hasSels, hasNotSels, next) {
  let code = {};
  let errors = [];

  markbotMain.send('check-group:item-computing', checkGroup, checkId);

  code = cheerio.load(fileContents);
  errors = errors.concat(checkHasElements(code, hasSels), checkHasNotElements(code, hasNotSels));

  markbotMain.send('check-group:item-complete', checkGroup, checkId, checkLabel, errors);
  next();
};

module.exports.init = function (group) {
  return (function (g) {
    const checkGroup = g;
    const checkLabel = 'Required elements';
    const checkId = 'elements';

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
