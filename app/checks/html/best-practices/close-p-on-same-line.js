'use strict';

const findClosingPTagLine = function (line, lines, fileContents) {
  let newLine = line + 1, totalLines = lines.length;

  while (newLine < totalLines) {
    if (/<\/p>/i.test(lines[newLine])) break;

    newLine++;
  }

  return newLine;
};

const nextLineStartsWithTag = function (line, lines, fileContents) {
  const startsWithTag = /^<\/?[a-z]+/i;
  const next = line + 1;

  if (next < lines.length - 1) {
    if (startsWithTag.test(lines[next].trim())) return true;
  }

  return false;
};

const closingPrevLineStartsWithTag = function (line, lines, fileContents) {
  const startsWithTag = /^<\/?[a-z]+/i;
  const closingLine = findClosingPTagLine(line, lines, fileContents);
  const prev = closingLine - 1;

  if (prev > 0) {
    if (startsWithTag.test(lines[prev].trim())) return true;
  }

  return false;
};

const isImmediatelyFollowedByTag = function (line, lines, fileContents) {
  const immediatelyFollowedByTag = /^<p[^>]*>\s*<[a-z]/i;

  return immediatelyFollowedByTag.test(lines[line].trim());
};

const isImmediatelyPrecededByTag = function (line, lines, fileContents) {
  const immediatelyPrecededByTag = /<[^>]+>\s*<\/p/;

  return immediatelyPrecededByTag.test(lines[line].trim());
};

const hasUnwrappedText = function (line, lines, fileContents) {
  const thisLine = lines[line].trim();
  const hasStuffAfterTag = /^<p[^>]*>.+/i;

  if (
    !isImmediatelyFollowedByTag(line, lines, fileContents)
    && hasStuffAfterTag.test(thisLine)
  ) return true;

  return false;
};

const hasBrTags = function (line, lines, fileContents) {
  const closingLine = findClosingPTagLine(line, lines, fileContents);

  for (let i = line; i <= closingLine; i++) {
    if (/\<br/i.test(lines[i].trim())) return true;
  }

  return false;
};

const hasOnlyTagsInside = function (line, lines, fileContents) {
  const immediatelyPrecededByText = /[^>]+<\p/;
  const theLine = lines[line].trim();
  const closingLine = findClosingPTagLine(line, lines, fileContents);

  if (
    (isImmediatelyFollowedByTag(line, lines, fileContents) || nextLineStartsWithTag(line, lines, fileContents))
    && (!immediatelyPrecededByText.test(theLine) || closingPrevLineStartsWithTag(line, lines, fileContents))
  ) {
    return true;
  }

  return false;
};

const shouldIncludeError = function (line, lines, fileContents) {
  if (hasBrTags(line, lines, fileContents)) return false;
  if (hasUnwrappedText(line, lines, fileContents)) return true;
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
    let closingLine = findClosingPTagLine(i, lines, fileContents);

    if (line.match(startsWithP) && !line.match(endsWithP)) {
      if (shouldIncludeError(i, lines, fileContents)) {
        errors.push(`Line ${i + 1}: Closing \`</p>\` tag should be on the same line as the opening \`<p>\` tag`);
        break;
      }

      if (isImmediatelyFollowedByTag(i, lines, fileContents)) {
        errors.push(`Line ${i + 1}: The opening \`<p>\` tag should be on its own line`);
        break;
      }

      if (isImmediatelyPrecededByTag(closingLine, lines, fileContents)) {
        errors.push(`Line ${i + 1}: The closing \`</p>\` tag should be on its own line`);
        break;
      }
    }
  }

  return errors;
};

module.exports = {
  check: check,
};
