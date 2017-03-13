'use strict';

const findClosingPTagLine = function (line, lines) {
  let newLine = line + 1, totalLines = lines.length;

  if (/<\/p>/i.test(lines[line])) return line;

  while (newLine < totalLines) {
    if (/<p/i.test(lines[newLine])) return false;
    if (/<\/p>/i.test(lines[newLine])) return newLine;

    newLine++;
  }

  return false;
};

const nextLineStartsWithTag = function (line, lines) {
  const startsWithTag = /^<\/?[a-z]+/i;
  const next = line + 1;

  if (next < lines.length - 1) {
    if (startsWithTag.test(lines[next].trim())) return true;
  }

  return false;
};

const closingPrevLineStartsWithTag = function (line, lines) {
  const startsWithTag = /^<\/?[a-z]+/i;
  const closingLine = findClosingPTagLine(line, lines);
  const prev = closingLine - 1;

  if (prev > 0) {
    if (startsWithTag.test(lines[prev].trim())) return true;
  }

  return false;
};

const isImmediatelyFollowedByTag = function (line, lines) {
  const immediatelyFollowedByTag = /^<p[^>]*>\s*<[a-z]/i;

  return immediatelyFollowedByTag.test(lines[line].trim());
};

const isImmediatelyPrecededByTag = function (line, lines) {
  const immediatelyPrecededByTag = /<[^>]+>\s*<\/p/;

  return immediatelyPrecededByTag.test(lines[line].trim());
};

const isImmediatelyPrecededByText = function (line, lines) {
  const immediatelyPrecededByText = /(.+)<\/p/;
  const matches = lines[line].trim().match(immediatelyPrecededByText);

  if (!matches || !matches[1]) return false;
  if (matches[1].trim() === '') return false;

  return true;
};

const hasUnwrappedText = function (line, lines, closingLine) {
  const thisLine = lines[line].trim();
  const hasStuffAfterTag = /^<p[^>]*>.+/i;
  const lineStartsWithTag = /^<[a-z0-9]+/i;
  const lineEndsWithTag = /<\/[a-z0-9]+>$/i;

  if (
    !isImmediatelyFollowedByTag(line, lines)
    && hasStuffAfterTag.test(thisLine)
  ) return true;

  for (let i = line + 1; i < closingLine; i++) {
    if (!lineStartsWithTag.test(lines[i].trim())) return true;
    if (!lineEndsWithTag.test(lines[i].trim())) return true;
  }

  if (isImmediatelyPrecededByText(closingLine, lines) && !isImmediatelyPrecededByTag(closingLine, lines)) return true;

  return false;
};

const hasBrTags = function (line, lines, closingLine) {
  for (let i = line; i <= closingLine; i++) {
    if (/<br/i.test(lines[i].trim())) return true;
  }

  return false;
};

const check = function (fileContents, lines) {
  let errors = [];
  let i = 0, total = lines.length;
  let startsWithP = /^<p[\s>]/i;
  let endsWithP = /<\/p>$/i;

  for (i; i < total; i++) {
    let line = lines[i].trim();

    if (line.match(startsWithP) && !line.match(endsWithP)) {
      let closingLine = findClosingPTagLine(i, lines);

      if (!closingLine) {
        errors.push(`Line ${i + 1}: The \`<p>\` tag is not closed, closing \`</p>\` tag is missing`);
        break;
      }

      if (hasBrTags(i, lines, closingLine)) continue;

      if (hasUnwrappedText(i, lines, closingLine)) {
        errors.push(`Line ${i + 1}: The \`<p>\` tag has text outside of elements, so the closing \`</p>\` tag should on the same line as the opening tag`);
        break;
      }

      if (isImmediatelyFollowedByTag(i, lines)) {
        errors.push(`Line ${i + 1}: The opening \`<p>\` tag should be on its own line`);
        break;
      }

      if (isImmediatelyPrecededByTag(closingLine, lines)) {
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
