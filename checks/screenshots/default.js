'use strict';

module.exports = `
  (function () {
    setTimeout(function () {
      document.title = document.documentElement.offsetHeight;
    }, 100);
  }());
`;
