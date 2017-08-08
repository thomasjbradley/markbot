'use strict';

const path = require('path');
const is = require('electron-is');
const {fork} = require('child_process');

let opts = {
  silent: true,
};

let server;
let app;

if (is.renderer()) {
  app = require('electron').remote.app;
} else {
  app = require('electron').app;
}

const start = function (port) {
  return new Promise((resolve, reject) => {
    server = fork(`${__dirname}/server-web-process.js`, opts);

    server.stderr.on('data', (data) => {
      reject(data.toString('utf8'));
    });

    server.send({ start: port }, (err) => {
      if (err) return reject(err.message);
    });

    server.on('message', (msg) => {
      if (msg.running) resolve();
    });
  });
};

const stop = function () {
  if (server) {
    server.send({ stop: true });
    server.kill();
  }
};

const setRoot = function (root) {
  server.send({ root: root });
};

module.exports = {
  start: start,
  stop: stop,
  setRoot: setRoot,
};
