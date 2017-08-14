'use strict';

const markbotMain = require('electron').remote.require('./app/markbot-main');

const bypass = function (checkGroup, checkId, checkLabel) {
  markbotMain.send('check-group:item-bypass', checkGroup, checkId, checkLabel, ['Skipped because of previous errors']);
};

const check = function (checkGroup, checkId, checkLabel, fileContents, next) {
  let errors = [];

  markbotMain.send('check-group:item-computing', checkGroup, checkId);

  markbotMain.send('check-group:item-complete', checkGroup, checkId, checkLabel, errors);
  next();
};

module.exports.init = function (group) {
  return (function (g) {
    const checkGroup = g;
    const checkLabel = 'Accessibility';
    const checkId = 'a11y';

    markbotMain.send('check-group:item-new', checkGroup, checkId, checkLabel);

    return {
      check: function (fileContents, next) {
        check(checkGroup, checkId, checkLabel, fileContents, next);
      },
      bypass: function () {
        bypass(checkGroup, checkId, checkLabel);
      }
    };
  }(group));
};
