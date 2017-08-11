'use strict';

const util = require('util');
const merge = require('merge-objects');
const markbotMain = require('../markbot-main');
const messageGroup = require(`${__dirname}/message-group`);

const cleanRegex = function (regex) {
  return regex.replace(/\\(?!\\)/g, '');
};

const convertToCheckObject = function (search, defaultMessage) {
  let obj = {
    check: false,
    regex: false,
    message: '',
    customMessage: '',
    type: 'error',
  };

  if (typeof search === 'string') {
    obj.regex = search;
  } else {
    if (Array.isArray(search)) {
      if (search.length > 1) obj.message = search[1];
      obj.regex = search[0];
    } else {
      obj = Object.assign(obj, search);

      if (obj.check) obj.regex = obj.check;

      if (Array.isArray(obj.regex)) {
        if (obj.regex.length > 1) obj.message = obj.regex[1];
        obj.regex = obj.regex[0];
      }
    }
  }

  if (!obj.message) obj.message = defaultMessage.replace(/\{\{regex\}\}/g, cleanRegex(obj.regex));

  return obj;
};

const convertToHasObject = function (search) {
  return convertToCheckObject(search, 'Expected to see this content: `{{regex}}`');
};

const convertToHasNotObject = function (search) {
  return convertToCheckObject(search, 'Unexpected `{{regex}}` — `{{regex}}` should not be used');
};

const bypass = function (checkGroup, checkId, checkLabel) {
  markbotMain.send('check-group:item-bypass', checkGroup, checkId, checkLabel, ['Skipped because of previous errors']);
};

const findSearchErrors = function (fileContents, searches) {
  let allMessages = messageGroup.new();

  searches.forEach(function (searchItem) {
    let search = convertToHasObject(searchItem);

    if (!fileContents.match(new RegExp(search.regex, 'gm'))) {
      allMessages = messageGroup.bind(search, allMessages);
    }
  });

  return allMessages;
};

const findSearchNotErrors = function (fileContents, searchNot) {
  let allMessages = messageGroup.new();

  searchNot.forEach(function (searchItem) {
    let search = convertToHasNotObject(searchItem);

    if (fileContents.match(new RegExp(search.regex, 'gm'))) {
      allMessages = messageGroup.bind(search, allMessages);
    }
  });

  return allMessages;
};

const check = function (checkGroup, checkId, checkLabel, fileContents, search, searchNot, next) {
  let allMessages = {};

  markbotMain.send('check-group:item-computing', checkGroup, checkId);

  if (search) allMessages = merge(allMessages, findSearchErrors(fileContents, search));
  if (searchNot) allMessages = merge(allMessages, findSearchNotErrors(fileContents, searchNot));

  markbotMain.send('check-group:item-complete', checkGroup, checkId, checkLabel, allMessages.errors, allMessages.messages, allMessages.warnings);
  next();
};

module.exports.init = function (group) {
  return (function (g) {
    let checkGroup = g;
    let checkLabel = 'Expected content';
    let checkId = 'content';

    markbotMain.send('check-group:item-new', checkGroup, checkId, checkLabel);

    return {
      check: function (fileContents, search, searchNot, next) {
        check(checkGroup, checkId, checkLabel, fileContents, search, searchNot, next);
      },
      bypass: function () {
        bypass(checkGroup, checkId, checkLabel);
      }
    };
  }(group));
};
