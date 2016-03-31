// Allow jQuery to run without Node collisions
// http://electron.atom.io/docs/v0.37.2/faq/electron-faq/#i-can-not-use-jqueryrequirejsmeteorangularjs-in-electron
window.nodeRequire = require;
delete window.require;
delete window.exports;
delete window.module;
