'use strict';

var
  util = require('util'),
  documentTagChecker = require('./best-practices/document-tags'),
  lineBreakChecker = require('./best-practices/force-line-breaks'),
  pTagCloseChecker = require('./best-practices/close-p-on-same-line'),
  missingOptionalTagChecker = require('./best-practices/missing-optional-closing-tags'),
  codeStyleChecker = require('./best-practices/code-style'),
  emptyLineChecker = require('./best-practices/max-empty-lines'),
  indentationChecker = require('./best-practices/indentation'),
  listener,
  checkGroup,
  checkLabel = 'Best practices & indentation',
  checkId = 'best-practices'
;

module.exports.init = function (lstnr, group) {
  listener = lstnr;
  checkGroup = group;

  listener.send('check-group:item-new', checkGroup, checkId, checkLabel);
};

module.exports.bypass = function () {
  listener.send('check-group:item-bypass', checkGroup, checkId, checkLabel, ['Skipped because of previous errors']);
};

module.exports.check = function (fullPath, fileContents, lines) {
  var
    missingDocumentTags,
    forceLineBreaks,
    checkClosingPSameLine,
    checkMissingOptionalTags,
    checkCodeStyle,
    checkEmptyLines,
    checkIndentation,
    indentation
  ;

  listener.send('check-group:item-computing', checkGroup, checkId);

  missingDocumentTags = documentTagChecker.check(fileContents, lines);

  if (missingDocumentTags && missingDocumentTags.length > 0) {
    listener.send('check-group:item-complete', checkGroup, checkId, checkLabel, missingDocumentTags, 'skip');
    return;
  }

  forceLineBreaks = lineBreakChecker.check(fileContents, lines);

  if (forceLineBreaks && forceLineBreaks.length > 0) {
    listener.send('check-group:item-complete', checkGroup, checkId, checkLabel, forceLineBreaks, 'skip');
    return;
  }

  checkClosingPSameLine = pTagCloseChecker.check(fileContents, lines);

  if (checkClosingPSameLine && checkClosingPSameLine.length > 0) {
    listener.send('check-group:item-complete', checkGroup, checkId, checkLabel, checkClosingPSameLine, 'skip');
    return;
  }

  checkMissingOptionalTags = missingOptionalTagChecker.check(fileContents, lines);

  if (checkMissingOptionalTags && checkMissingOptionalTags.length > 0) {
    listener.send('check-group:item-complete', checkGroup, checkId, checkLabel, checkMissingOptionalTags, 'skip');
    return;
  }

  checkCodeStyle = codeStyleChecker.check(fileContents, lines);

  if (checkCodeStyle && checkCodeStyle.length > 0) {
    listener.send('check-group:item-complete', checkGroup, checkId, checkLabel, checkCodeStyle, 'skip');
    return;
  }

  checkEmptyLines = emptyLineChecker.check(fileContents, lines);

  if (checkEmptyLines && checkEmptyLines.length > 0) {
    listener.send('check-group:item-complete', checkGroup, checkId, checkLabel, checkEmptyLines, 'skip');
    return;
  }

  checkIndentation = indentationChecker.check(fileContents, lines);

  if (checkIndentation && checkIndentation.length > 0) {
    listener.send('check-group:item-complete', checkGroup, checkId, checkLabel, checkIndentation);
    return;
  }

  listener.send('check-group:item-complete', checkGroup, checkId, checkLabel);
};
