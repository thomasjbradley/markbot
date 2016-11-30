'use strict';

const util = require('util');
const markbotMain = require('electron').remote.require('./app/markbot-main');
const documentTagChecker = require(__dirname + '/best-practices/document-tags');
const lineBreakChecker = require(__dirname + '/best-practices/force-line-breaks');
const pTagCloseChecker = require(__dirname + '/best-practices/close-p-on-same-line');
const missingOptionalTagChecker = require(__dirname + '/best-practices/missing-optional-closing-tags');
const codeStyleChecker = require(__dirname + '/best-practices/code-style');
const emptyLineChecker = require(__dirname + '/best-practices/max-empty-lines');
const viewportChecker = require(__dirname + '/best-practices/viewport');
const doublespaceChecker = require(__dirname + '/best-practices/double-space');
const spaceBeforeCloseGTChecker = require(__dirname + '/best-practices/space-before-close-greater-than');
const indentationChecker = require(__dirname + '/best-practices/indentation');

const bypass = function (checkGroup, checkId, checkLabel) {
  markbotMain.send('check-group:item-bypass', checkGroup, checkId, checkLabel, ['Skipped because of previous errors']);
};

const check = function (checkGroup, checkId, checkLabel, fileContents, lines, next) {
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

  markbotMain.send('check-group:item-computing', checkGroup, checkId);

  missingDocumentTags = documentTagChecker.check(fileContents, lines);

  if (missingDocumentTags && missingDocumentTags.length > 0) {
    markbotMain.send('check-group:item-complete', checkGroup, checkId, checkLabel, missingDocumentTags, 'skip');
    return next();
  }

  forceLineBreaks = lineBreakChecker.check(fileContents, lines);

  if (forceLineBreaks && forceLineBreaks.length > 0) {
    markbotMain.send('check-group:item-complete', checkGroup, checkId, checkLabel, forceLineBreaks, 'skip');
    return next();
  }

  checkClosingPSameLine = pTagCloseChecker.check(fileContents, lines);

  if (checkClosingPSameLine && checkClosingPSameLine.length > 0) {
    markbotMain.send('check-group:item-complete', checkGroup, checkId, checkLabel, checkClosingPSameLine, 'skip');
    return next();
  }

  checkMissingOptionalTags = missingOptionalTagChecker.check(fileContents, lines);

  if (checkMissingOptionalTags && checkMissingOptionalTags.length > 0) {
    markbotMain.send('check-group:item-complete', checkGroup, checkId, checkLabel, checkMissingOptionalTags, 'skip');
    return next();
  }

  checkCodeStyle = codeStyleChecker.check(fileContents, lines);

  if (checkCodeStyle && checkCodeStyle.length > 0) {
    markbotMain.send('check-group:item-complete', checkGroup, checkId, checkLabel, checkCodeStyle, 'skip');
    return next();
  }

  checkEmptyLines = emptyLineChecker.check(fileContents, lines);

  if (checkEmptyLines && checkEmptyLines.length > 0) {
    markbotMain.send('check-group:item-complete', checkGroup, checkId, checkLabel, checkEmptyLines, 'skip');
    return next();
  }

  checkViewport = viewportChecker.check(fileContents, lines);

  if (checkViewport && checkViewport.length > 0) {
    markbotMain.send('check-group:item-complete', checkGroup, checkId, checkLabel, checkViewport, 'skip');
    return next();
  }

  checkDoubleSpacing = doublespaceChecker.check(fileContents, lines);

  if (checkDoubleSpacing && checkDoubleSpacing.length > 0) {
    markbotMain.send('check-group:item-complete', checkGroup, checkId, checkLabel, checkDoubleSpacing, 'skip');
    return next();
  }

  checkSpaceBeforeCloseGT = spaceBeforeCloseGTChecker.check(fileContents, lines);

  if (checkSpaceBeforeCloseGT && checkSpaceBeforeCloseGT.length > 0) {
    markbotMain.send('check-group:item-complete', checkGroup, checkId, checkLabel, checkSpaceBeforeCloseGT, 'skip');
    return next();
  }

  checkIndentation = indentationChecker.check(fileContents, lines);

  if (checkIndentation && checkIndentation.length > 0) {
    markbotMain.send('check-group:item-complete', checkGroup, checkId, checkLabel, checkIndentation);
    return next();
  }

  markbotMain.send('check-group:item-complete', checkGroup, checkId, checkLabel);
  next();
};

module.exports.init = function (group) {
  return (function (g) {
    const checkGroup = g;
    const checkLabel = 'Best practices & indentation';
    const checkId = 'best-practices';

    markbotMain.send('check-group:item-new', checkGroup, checkId, checkLabel);

    return {
      check: function (fileContents, lines, next) {
        check(checkGroup, checkId, checkLabel, fileContents, lines, next);
      },
      bypass: function () {
        bypass(checkGroup, checkId, checkLabel);
      }
    };
  }(group));
};
