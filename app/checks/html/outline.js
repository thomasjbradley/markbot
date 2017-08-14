'use strict';

const util = require('util');
const parse5 = require('parse5');
const cheerio = require('cheerio');
const markbotMain = require('electron').remote.require('./app/markbot-main');

const getLevel = function (elem) {
  return parseInt(elem.name.slice(1), 10);
}

const bypass = function (checkGroup, checkId, checkLabel) {
  markbotMain.send('check-group:item-bypass', checkGroup, checkId, checkLabel, ['Skipped because of previous errors']);
};

const check = function (checkGroup, checkId, checkLabel, fileContents, next) {
  let code = {};
  let outline = [];
  let headings = [];
  let errors = [];
  let messages = [];
  let lastLevel = 1;
  let lastLevelText = '';
  const parsedHtml = parse5.parse(fileContents, {
    treeAdapter: parse5.treeAdapters.htmlparser2,
    locationInfo: true,
  });

  markbotMain.send('check-group:item-computing', checkGroup, checkId);

  code = cheerio.load(parsedHtml.children);
  headings = code('h1, h2, h3, h4, h5, h6');

  if (headings.length <= 0) {
    markbotMain.send('check-group:item-complete', checkGroup, checkId, checkLabel, ['There are no headings in the document — there should be at least an `<h1>`']);
    return next();
  }

  if (getLevel(headings[0]) != 1) {
    markbotMain.send('check-group:item-complete', checkGroup, checkId, checkLabel, [`Line ${headings[0].__location.line}: The first heading in the document is an \`<h${getLevel(headings[0])}>\` — but documents must start with an \`<h1>\``]);
    return next();
  }

  lastLevelText = headings.eq(0).html();

  headings.each(function (i, elem) {
    let level = getLevel(elem);
    let text = cheerio(elem).html();
    let outlineItem = {
      text: `\`<h${level}>\` ${text}`,
      depth: level,
      hasError: false,
    };


    if (i === 0) {
      outline.push(outlineItem);
      return;
    }

    if (level == 1) {
      errors.push(`Line ${elem.__location.line}: Another \`<h1>\` was found, \`<h1>${text}</h1>\` — there can only be one \`<h1>\` per page`);
      outlineItem.text = `\`<h${level}>\` ***${text}***`;
      outlineItem.hasError = true;
    }

    if (level > lastLevel + 1) {
      errors.push(`Line ${elem.__location.line}: Heading, \`<h${level}>${text}</h${level}>\`, is level ${level} but the previous heading was level ${lastLevel} \`<h${lastLevel}>${lastLevelText}</h${lastLevel}>\``);
      outlineItem.text = `\`<h${level}>\` ***${text}***`;
      outlineItem.hasError = true;
    }

    outline.push(outlineItem);
    lastLevel = level;
    lastLevelText = cheerio(elem).html();
  });

  if (errors.length <= 0) {
    messages.push({
      type: 'outline',
      message: 'The heading outline generated from the HTML is acceptable:',
      items: outline,
    });
  } else {
    errors.push({
      type: 'outline',
      message: 'The heading outline generated from the HTML is out of order:',
      items: outline,
    });
  }

  markbotMain.send('check-group:item-complete', checkGroup, checkId, checkLabel, errors, messages);
  next();
};

module.exports.init = function (group) {
  return (function (g) {
    const checkGroup = g;
    const checkLabel = 'Heading structure';
    const checkId = 'outline';

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
