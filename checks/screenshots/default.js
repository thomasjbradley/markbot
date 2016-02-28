'use strict';

module.exports = function (width, defaultHeight) {
  return `
    (function () {
      setTimeout(function () {
        if (document.documentElement.offsetHeight < window.innerHeight) {
          if (document.documentElement.offsetHeight < ${defaultHeight}) {
            document.title = ${defaultHeight};
          } else {
            document.title = document.documentElement.offsetHeight;
          }

          return;
        }

        if (document.documentElement.offsetHeight > ${defaultHeight}) {
          document.title = document.documentElement.offsetHeight;
          return;
        }

        if (document.documentElement.offsetHeight < ${defaultHeight}) {
          document.title = ${defaultHeight};
          return;
        }
      }, 100);
    }());
  `;
};
