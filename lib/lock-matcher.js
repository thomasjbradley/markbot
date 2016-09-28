'use strict';

module.exports.match = function (primary, secondary) {
  let
    isCheater = false,
    matches = {}
    ;

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

  return {
    cheated: isCheater,
    matches: matches
  };
};
