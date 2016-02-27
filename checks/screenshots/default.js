'use strict';

module.exports = function (width, defaultHeight) {
  return `
    (function () {
      window.resizeTo(${width}, ${defaultHeight});

      setTimeout(function () {
        if (document.documentElement.offsetHeight < window.innerHeight) {
          if (document.documentElement.offsetHeight < ${defaultHeight}) {
            window.resizeTo(${width}, ${defaultHeight});
            console.log('third', ${width}, ${defaultHeight});
          } else {
            window.resizeTo(${width}, document.documentElement.offsetHeight);
            console.log('forth', ${width}, document.documentElement.offsetHeight);
          }

          return;
        }

        if (document.documentElement.offsetHeight > ${defaultHeight}) {
          window.resizeTo(${width}, document.documentElement.offsetHeight);
          console.log('first', ${width}, document.documentElement.offsetHeight);
          return;
        }

        if (document.documentElement.offsetHeight < ${defaultHeight}) {
          window.resizeTo(${width}, ${defaultHeight});
          console.log('second', ${width}, ${defaultHeight});
          return;
        }
      }, 100);
    }());
  `;
};
