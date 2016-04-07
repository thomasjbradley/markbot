'use strict';

var
  util = require('util'),
  linter = require('stylelint'),
  viewportChecker = require('./best-practices/viewport')
;

const shouldIncludeError = function (message, line, lines, fileContents) {
  /* SVG overflow: hidden CSS */
  if (message.match(/selector-root-no-composition/) && lines[line - 1] && lines[line - 1].match(/svg/)) return false;
  if (message.match(/root-no-standard-properties/) && lines[line - 2] && lines[line - 2].match(/svg/)) return false;

  return true;
};

const bypass = function (listener, checkGroup, checkId, checkLabel) {
  listener.send('check-group:item-bypass', checkGroup, checkId, checkLabel, ['Skipped because of previous errors']);
};

const check = function (listener, checkGroup, checkId, checkLabel, fileContents, lines) {
  let
    errors = [],
    checkViewport
    ;

  listener.send('check-group:item-computing', checkGroup, checkId);

  checkViewport = viewportChecker.check(fileContents, lines);

  if (checkViewport && checkViewport.length > 0) {
    listener.send('check-group:item-complete', checkGroup, checkId, checkLabel, checkViewport, 'skip');
    return;
  }

  linter.lint({code: fileContents, config: require('./stylelint.json')})
    .then(function (data) {
      if (data.results) {
        data.results[0].warnings.forEach(function (item) {
          if (shouldIncludeError(item.text, item.line, lines, fileContents)) {
            errors.push(util.format('Line %d: %s', item.line, item.text.replace(/\(.+?\)$/, '').replace(/"/g, '`')));
          }
        });
      }

      listener.send('check-group:item-complete', checkGroup, checkId, checkLabel, errors);
    })
    .catch(function (err) {
      if (err.reason && err.line) {
        errors.push(`Line ${err.line}: ${err.reason}`);
        listener.send('check-group:item-complete', checkGroup, checkId, checkLabel, errors);
      }
    })
    ;
};

module.exports.init = function (lstnr, group) {
  return (function (l, g) {
    let
      listener = l,
      checkGroup = g,
      checkLabel = 'Best practices & indentation',
      checkId = 'best-practices'
    ;

    listener.send('check-group:item-new', checkGroup, checkId, checkLabel);

    return {
      check: function (fileContents, lines) {
        check(listener, checkGroup, checkId, checkLabel, fileContents, lines);
      },
      bypass: function () {
        bypass(listener, checkGroup, checkId, checkLabel);
      }
    };
  }(lstnr, group));
};
