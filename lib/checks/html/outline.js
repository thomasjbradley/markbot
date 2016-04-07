'use strict';

var
  util = require('util'),
  cheerio = require('cheerio')
;

const getLevel = function (elem) {
  return parseInt(elem.name.slice(1), 10);
}

const bypass = function (listener, checkGroup, checkId, checkLabel) {
  listener.send('check-group:item-bypass', checkGroup, checkId, checkLabel, ['Skipped because of previous errors']);
};

const check = function (listener, checkGroup, checkId, checkLabel, fileContents) {
  var
    code = {},
    headings = [],
    errors = [],
    lastLevel = 1,
    lastLevelText = ''
    ;

  listener.send('check-group:item-computing', checkGroup, checkId);

  code = cheerio.load(fileContents);
  headings = code('h1, h2, h3, h4, h5, h6');

  if (headings.length <= 0) {
    listener.send('check-group:item-complete', checkGroup, checkId, checkLabel, ['There are no headings in the document — there should be at least an `<h1>`']);
    return;
  }

  if (getLevel(headings[0]) != 1) {
    listener.send('check-group:item-complete', checkGroup, checkId, checkLabel, [`The first heading in the document is an \`<h${getLevel(headings[0])}>\` — but documents must start with an \`<h1>\``]);
    return;
  }

  lastLevelText = headings.eq(0).html();

  headings.each(function (i, elem) {
    let level = getLevel(elem);

    if (i === 0) return;

    if (level == 1) {
      errors.push(`Another <h1> was found, \`<h1>${cheerio(elem).html()}</h1>\` — there can only be one \`<h1>\` per page`);
    }

    if (level > lastLevel + 1) {
      errors.push(`Heading, \`<h${level}>${cheerio(elem).html()}</h${level}>\`, is level ${level} but the previous heading was level ${lastLevel} \`<h${lastLevel}>${lastLevelText}</h${lastLevel}>\``);
    }

    lastLevel = level;
    lastLevelText = cheerio(elem).html();
  });

  listener.send('check-group:item-complete', checkGroup, checkId, checkLabel, errors);
};

module.exports.init = function (lstnr, group) {
  return (function (l, g) {
    let
      listener = l,
      checkGroup = g,
      checkLabel = 'Heading structure',
      checkId = 'outline'
    ;

    listener.send('check-group:item-new', checkGroup, checkId, checkLabel);

    return {
      check: function (fileContents) {
        check(listener, checkGroup, checkId, checkLabel, fileContents);
      },
      bypass: function () {
        bypass(listener, checkGroup, checkId, checkLabel);
      }
    };
  }(lstnr, group));
};
