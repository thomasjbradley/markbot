'use strict';

module.exports.match = function (primary, secondary) {
  let
    isCheater = false,
    matches = {}
    ;

  if (primary) {
    for (let key in primary) {
      if (secondary[key] && primary[key] == secondary[key]) {
        matches[key] = true;
      } else {
        matches[key] = false;
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
