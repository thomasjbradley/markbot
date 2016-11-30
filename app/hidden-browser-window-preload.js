// Allow jQuery to run without Node collisions
// http://electron.atom.io/docs/v0.37.2/faq/electron-faq/#i-can-not-use-jqueryrequirejsmeteorangularjs-in-electron
window.nodeRequire = require;
delete window.require;
delete window.exports;
delete window.module;

window.__markbotGetBrowserWindow = function () {
  return nodeRequire('electron').remote.BrowserWindow.fromId(window.__markbot_hidden_browser_window_id).webContents;
};

window.addEventListener('error', function (err) {
  __markbotGetBrowserWindow().send('__markbot-functionality-error', err.message, err.lineno, err.filename);
});

window.addEventListener('load', function (ev) {
  window.requestAnimationFrame(function () {
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          process.nextTick(function () {
            window.__markbotGetBrowserWindow().send('__markbot-hidden-browser-window-loaded', {location: window.location.href});
          });
        });
      });
    });
  });
});

document.fonts.ready.then(function () {
  window.requestAnimationFrame(function () {
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          process.nextTick(function () {
            window.__markbotGetBrowserWindow().send('__markbot-hidden-browser-window-fonts-loaded', {location: window.location.href});
          });
        });
      });
    });
  });
});
