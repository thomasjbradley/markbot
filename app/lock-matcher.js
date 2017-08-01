'use strict';

module.exports.match = function (primary, secondary, markbotIgnoreFile) {
  let isCheater = false;
  let matches = {};

  if (primary) {
    for (let key in primary) {
      if (secondary[key] && primary[key] == secondary[key]) {
        matches[key] = {
          equal: true,
          expectedHash: primary[key],
          actualHash: secondary[key],
        };
      } else {
        matches[key] = {
          equal: false,
          expectedHash: primary[key],
          actualHash: secondary[key],
        };
        isCheater = true;
      }
    }
  } else {
    isCheater = true;
  }

  if (!matches.markbot) {
    isCheater = true;
    matches.markbot = {
      equal: false,
      expectedHash: false,
      actualHash: false,
    };
  }

  if (!matches.markbotignore && markbotIgnoreFile.length > 0) {
    isCheater = true;
    matches.markbotignore = {
      equal: false,
      expectedHash: false,
      actualHash: false,
    };
  }

  return {
    cheated: isCheater,
    matches: matches
  };
};
