'use strict';

const findClosingPTagLine = function (line, lines, fileContents) {
  let newLine = line + 1, totalLines = lines.length;

  while (newLine < totalLines) {
    if (/<\/p>/i.test(lines[newLine])) break;

    newLine++;
  }

  return newLine;
};

const hasUnwrappedTextOnSameLine = function (line, lines, fileContents) {
  const thisLine = lines[line].trim();
  const immediatelyFollowedByTag = /^<p[^>]*>\s*<[a-z]/i;
  const hasStuffAfterTag = /^<p[^>]*>.+/i;

  if (!immediatelyFollowedByTag.test(thisLine) && hasStuffAfterTag.test(thisLine)) return true;

  return false;
};

const hasBrTags = function (line, lines, fileContents) {
  const closingLine = findClosingPTagLine(line, lines, fileContents);

  for (let i = line; i <= closingLine; i++) {
    if (/\<br/i.test(lines[line].trim())) return true;
  }

  return false;
};

const nextLineStartsWithTag = function (line, lines, fileContents) {
  const startsWithTag = /^<\/?[a-z]+/i;
  const next = line--;

  if (next < lines.length) {
    if (startsWithTag.test(lines[next].trim())) return true;
  }

  return false;
};

const prevLineStartsWithTag = function (line, lines, fileContents) {
  const startsWithTag = /^<\/?[a-z]+/i;
  const prev = line--;

  if (prev > 0) {
    if (startsWithTag.test(lines[prev].trim())) return true;
  }

  return false;
};

const hasOnlyTagsInside = function (line, lines, fileContents) {
  const immediatelyFollowedByTag = /^<p[^>]*>\s*<[a-z]/i;
  const immediatelyPrecededByTag = /^<[^>]+><\p/;
  const immediatelyPrecededByText = /[^>]+<\p/;
  const theLine = lines[line].trim();
  const closingLine = findClosingPTagLine(line, lines, fileContents);

  if (
    (immediatelyFollowedByTag.test(theLine) || nextLineStartsWithTag(line, lines, fileContents))
    && ((immediatelyPrecededByTag.test(theLine) && !immediatelyPrecededByText.test(theLine)) || prevLineStartsWithTag(line, lines, fileContents))
  ) {
    return true;
  }

  return false;
};

const shouldIncludeError = function (line, lines, fileContents) {
  if (hasUnwrappedTextOnSameLine(line, lines, fileContents)) return true;
  if (hasBrTags(line, lines, fileContents)) return false;
  if (hasOnlyTagsInside(line, lines, fileContents)) return false;

  return true;
};

const check = function (fileContents, lines) {
  let errors = [];
  let i = 0, total = lines.length;
  let startsWithP = /^<p[\s>]/i;
  let endsWithP = /<\/p>$/i;

  for (i; i < total; i++) {
    let line = lines[i].trim();

    if (line.match(startsWithP) && !line.match(endsWithP)) {
      if (shouldIncludeError(i, lines, fileContents)) {
        errors.push(`Line ${i + 1}: Closing \`</p>\` tag should be on the same line as the opening \`<p>\` tag`);
        break;
      }
    }
  }

  return errors;
};

module.exports = {
  check: check,
};
