'use strict';

const util = require('util');
const cheerio = require('cheerio');
const merge = require('merge-objects');
const markbotMain = require('electron').remote.require('./app/markbot-main');
const messageGroup = require(`${__dirname}/../message-group`);

const convertToCheckObject = function (sel, defaultMessage) {
  let obj = {
    check: false,
    selector: false,
    message: '',
    customMessage: '',
    type: 'error',
  };

  if (typeof sel === 'string') {
    obj.selector = sel;
  } else {
    if (Array.isArray(sel)) {
      obj.selector = sel[0];
      if (sel[1]) obj.customMessage = sel[1];
    } else {
      obj = Object.assign(obj, sel);

      if (obj.check) obj.selector = obj.check;

      if (Array.isArray(obj.selector)) {
        obj.customMessage = obj.selector[1];
        obj.selector = obj.selector[0];
      }
    }
  }

  if (!obj.message) obj.message = defaultMessage.replace(/\{\{sel\}\}/g, obj.selector);

  return obj;
};

const convertToHasObject = function (sel) {
  return convertToCheckObject(sel, 'Expected to see this element: `{{sel}}`');
};

const convertToHasNotObject = function (sel) {
  return convertToCheckObject(sel, 'The `{{sel}}` element should not be used');
};

const bypass = function (checkGroup, checkId, checkLabel) {
  markbotMain.send('check-group:item-bypass', checkGroup, checkId, checkLabel, ['Skipped because of previous errors']);
};

const checkHasElements = function (code, sels) {
  var allMessages = messageGroup.new();

  sels.forEach(function (sel) {
    let check = convertToHasObject(sel);

    try {
      if (code(check.selector).length <= 0) {
        allMessages = messageGroup.bind(check, allMessages);
      }
    } catch (e) {
      allMessages = messageGroup.bind(check, allMessages);
    }
  });

  return allMessages;
};

const checkHasNotElements = function (code, sels) {
  var allMessages = messageGroup.new();

  sels.forEach(function (sel) {
    let check = convertToHasNotObject(sel);

    try {
      if (code(check.selector).length > 0) {
        allMessages = messageGroup.bind(check, allMessages);
      }
    } catch (e) {
      allMessages = messageGroup.bind(check, allMessages);
    }
  });

  return allMessages;
};

const check = function (checkGroup, checkId, checkLabel, fileContents, hasSels, hasNotSels, next) {
  let code = {};
  let allMessages;

  markbotMain.send('check-group:item-computing', checkGroup, checkId);

  code = cheerio.load(fileContents);
  allMessages = merge(checkHasElements(code, hasSels), checkHasNotElements(code, hasNotSels));

  markbotMain.send('check-group:item-complete', checkGroup, checkId, checkLabel, allMessages.errors, allMessages.messages, allMessages.warnings);
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
