'use strict';

const css = require('css');
const merge = require('merge-objects');
const markbotMain = require('electron').remote.require('./app/markbot-main');
const messageGroup = require(`${__dirname}/../message-group`);

const convertToCheckObject = function (sel, opts) {
  let obj = {
    check: false,
    mediaQuery: false,
    selector: false,
    properties: false,
    value: false,
    message: '',
    customMessage: '',
    type: 'error',
  };

  if (!opts.hasOwnProperty('hasValues')) opts.hasValues = false;

  const bindToObj = function (checkArray) {
    if (checkArray[0].substr(0, 1) === '@') {
      obj.mediaQuery = checkArray.shift().replace(/\@/, '');
    }

    if (checkArray.length > 0) obj.selector = checkArray[0];
    if (checkArray.length > 1) obj.properties = checkArray[1];

    if (opts.hasValues) {
      if (checkArray.length > 2) obj.value = checkArray[2];
      if (checkArray.length > 3) obj.customMessage = checkArray[3];
    } else {
      if (checkArray.length > 2) obj.customMessage = checkArray[2];
    }
  };

  if (typeof sel === 'string') {
    obj.selector = sel;
  } else {
    if (Array.isArray(sel)) {
      bindToObj(sel);
    } else {
      if (sel.message) sel.customMessage = sel.message;

      obj = Object.assign(obj, sel);

      if (obj.check) bindToObj(obj.check);
    }
  }

  if (typeof obj.mediaQuery === 'string') obj.mediaQuery = obj.mediaQuery.replace(/\@/g, '');
  if (typeof obj.properties === 'string') obj.properties = [obj.properties];

  return obj;
};

const convertToHasObject = function (sel) {
  return convertToCheckObject(sel, { hasValues: true });
};

const convertToHasNotObject = function (sel) {
  return convertToCheckObject(sel, { hasValues: false });
};

const bypass = function (checkGroup, checkId, checkLabel) {
  markbotMain.send('check-group:item-bypass', checkGroup, checkId, checkLabel, ['Skipped because of previous errors']);
};

const checkHasProperties = function (code, sels) {
  let allMessages = messageGroup.new();
  let i = 0;
  let totalTests = sels.length;
  let rules = [];
  let decs = [];
  let context = '';
  let ruleset = [];

  if (totalTests == 0) return allMessages;

  for (i = 0; i < totalTests; i++) {
    let check = convertToHasObject(sels[i]);

    if (check.mediaQuery) {
      let tmpRules = code.stylesheet.rules.filter(function (obj) {
        if (obj.type !== 'media') return false;
        return obj.media.includes(check.mediaQuery);
      });

      if (!tmpRules || tmpRules.length <= 0 || tmpRules[0].rules.length <= 0) {
        check.message = `Expected to see the \`@${check.mediaQuery}\` media query`;
        allMessages = messageGroup.bind(check, allMessages);
        continue;
      }

      if (!check.selector) continue;

      context = ` in the \`@${check.mediaQuery}\` media query`;
      ruleset = tmpRules[0].rules;
    } else {
      context = '';
      ruleset = code.stylesheet.rules;
    }

    rules = ruleset.filter(function (obj) {
      if (!obj.selectors) return false;
      return obj.selectors[0] == check.selector;
    });

    if (!rules || rules.length <= 0) {
      check.message = `Expected to see the \`${check.selector}\` selector${context}`;
      allMessages = messageGroup.bind(check, allMessages);
      continue;
    }

    if (!check.properties) continue;

    check.properties.forEach((prop) => {
      decs = rules[0].declarations.filter(function (obj) {
        if (!obj.property) return false;
        return obj.property == prop;
      });

      if (!decs || decs.length <= 0) {
        check.message = `Line ${rules[0].position.start.line}: Expected to see \`${prop}\` inside \`${check.selector} {}\`${context}`;
        allMessages = messageGroup.bind(check, allMessages);
      }
    });

    if (!check.value || check.properties.length > 1) continue;

    if (decs[0].value != check.value) {
      check.message = `Line ${decs[0].position.start.line}: Expected to see \`${check.properties[0]}\` with a different value inside \`${check.selector} {}\`${context}`;
      allMessages = messageGroup.bind(check, allMessages);
      continue;
    }
  }

  return allMessages;
};

const checkHasNotProperties = function (code, sels) {
  let allMessages = messageGroup.new();
  let i = 0;
  let totalTests = sels.length;
  let rules = [];
  let decs = [];
  let context = '';
  let ruleset = [];

  if (totalTests == 0) return allMessages;

  for (i = 0; i < totalTests; i++) {
    let check = convertToHasNotObject(sels[i]);

    if (check.mediaQuery) {
      let tmpRules = code.stylesheet.rules.filter(function (obj) {
        if (obj.type !== 'media') return false;
        return obj.media.includes(check.mediaQuery);
      });

      if (!tmpRules || tmpRules.length <= 0 || tmpRules[0].rules.length <= 0) continue;

      if (!check.selector) {
        check.message = `Line ${tmpRules[0].position.start.line}: The \`@${check.mediaQuery}\` media query should not be used`;
        allMessages = messageGroup.bind(check, allMessages);
        continue;
      }

      context = ` in the \`@${check.mediaQuery}\` media query`;
      ruleset = tmpRules[0].rules;
    } else {
      ruleset = code.stylesheet.rules;
    }

    rules = ruleset.filter(function (obj) {
      if (!obj.selectors) return false;
      return obj.selectors[0] == check.selector;
    });

    if (!rules || rules.length <= 0) continue;

    if (rules && !check.properties) {
      check.message = `Line ${rules[0].position.start.line}: The \`${check.selector}\` selector should not be used${context}`;
      allMessages = messageGroup.bind(check, allMessages);
      continue;
    }

    check.properties.forEach(function (prop) {
      decs = rules[0].declarations.filter(function (obj) {
        if (!obj.property) return false;
        return obj.property == prop;
      });

      if (decs && decs.length > 0) {
        check.message = `Line ${decs[0].position.start.line}: The \`${check.selector}\` selector cannot have the \`${prop}\` property${context}`;
        allMessages = messageGroup.bind(check, allMessages);
      }
    });
  }

  return allMessages;
};

const check = function (checkGroup, checkId, checkLabel, fileContents, hasSels, hasNotSels, next) {
  let code = {};
  let allMessages;

  markbotMain.send('check-group:item-computing', checkGroup, checkId);

  try {
    code = css.parse(fileContents);
    allMessages = merge(checkHasProperties(code, hasSels), checkHasNotProperties(code, hasNotSels));
    markbotMain.send('check-group:item-complete', checkGroup, checkId, checkLabel, allMessages.errors, allMessages.messages, allMessages.warnings);
  } catch (e) {
    if (e.reason && e.line) markbotMain.send('check-group:item-complete', checkGroup, checkId, checkLabel, [`Line ${e.line}: ${e.reason}`]);
  }

  next();
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
