'use strict';

module.exports = function (width, defaultHeight) {
  return `
    (function () {
      setTimeout(function () {
        if (document.documentElement.offsetHeight < window.innerHeight) {
          if (document.documentElement.offsetHeight < ${defaultHeight}) {
            require('electron').ipcRenderer.send('webpage-height', ${defaultHeight});
          } else {
            require('electron').ipcRenderer.send('webpage-height', document.documentElement.offsetHeight);
          }

          return;
        }

        if (document.documentElement.offsetHeight > ${defaultHeight}) {
          require('electron').ipcRenderer.send('webpage-height', document.documentElement.offsetHeight);
          return;
        }

        if (document.documentElement.offsetHeight < ${defaultHeight}) {
          require('electron').ipcRenderer.send('webpage-height', ${defaultHeight});
          return;
        }
      }, 100);
    }());
  `;
};
