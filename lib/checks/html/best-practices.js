'use strict';

const util = require('util');
const documentTagChecker = require('./best-practices/document-tags');
const lineBreakChecker = require('./best-practices/force-line-breaks');
const pTagCloseChecker = require('./best-practices/close-p-on-same-line');
const missingOptionalTagChecker = require('./best-practices/missing-optional-closing-tags');
const codeStyleChecker = require('./best-practices/code-style');
const emptyLineChecker = require('./best-practices/max-empty-lines');
const viewportChecker = require('./best-practices/viewport');
const doublespaceChecker = require('./best-practices/double-space');
const spaceBeforeCloseGTChecker = require('./best-practices/space-before-close-greater-than');
const indentationChecker = require('./best-practices/indentation');

const bypass = function (listener, checkGroup, checkId, checkLabel) {
  listener.send('check-group:item-bypass', checkGroup, checkId, checkLabel, ['Skipped because of previous errors']);
};

const check = function (listener, checkGroup, checkId, checkLabel, fileContents, lines) {
  let missingDocumentTags;
  let forceLineBreaks;
  let checkClosingPSameLine;
  let checkMissingOptionalTags;
  let checkCodeStyle;
  let checkEmptyLines;
  let checkViewport;
  let checkDoubleSpacing;
  let checkSpaceBeforeCloseGT;
  let checkIndentation;
  let indentation;

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

  checkViewport = viewportChecker.check(fileContents, lines);

  if (checkViewport && checkViewport.length > 0) {
    listener.send('check-group:item-complete', checkGroup, checkId, checkLabel, checkViewport, 'skip');
    return;
  }

  checkDoubleSpacing = doublespaceChecker.check(fileContents, lines);

  if (checkDoubleSpacing && checkDoubleSpacing.length > 0) {
    listener.send('check-group:item-complete', checkGroup, checkId, checkLabel, checkDoubleSpacing, 'skip');
    return;
  }

  checkSpaceBeforeCloseGT = spaceBeforeCloseGTChecker.check(fileContents, lines);

  if (checkSpaceBeforeCloseGT && checkSpaceBeforeCloseGT.length > 0) {
    listener.send('check-group:item-complete', checkGroup, checkId, checkLabel, checkSpaceBeforeCloseGT, 'skip');
    return;
  }

  checkIndentation = indentationChecker.check(fileContents, lines);

  if (checkIndentation && checkIndentation.length > 0) {
    listener.send('check-group:item-complete', checkGroup, checkId, checkLabel, checkIndentation);
    return;
  }

  listener.send('check-group:item-complete', checkGroup, checkId, checkLabel);
};

module.exports.init = function (lstnr, group) {
  return (function (l, g) {
    let listener = l;
    let checkGroup = g;
    let checkLabel = 'Best practices & indentation';
    let checkId = 'best-practices';

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
