'use strict';

const path = require('path');
const is = require('electron-is');
const {spawn} = require('child_process');

let opts = {
  detached: true,
};

let args = [
  '-cp',
  'vnu.jar',
  'nu.validator.servlet.Main',
];

let server;
let app;

if (is.renderer()) {
  app = require('electron').remote.app;
} else {
  app = require('electron').app;
}

const start = function (port) {
  const validatorPath = path.resolve(__dirname.replace(/app.asar[\/\\]/, 'app.asar.unpacked/') + '/../vendor/html-validator');

  args.push(port);
  opts.cwd = validatorPath;

  return new Promise((resolve, reject) => {
    server = spawn('java', args, opts);
    server.unref();

    server.stderr.on('data', (data) => {
      if (process.platform === 'darwin') {
        let message = data.toString('utf8');
        let info = /INFO/;

        if (!info.test(message)) reject('There was an error starting the HTML validator');
      }
    });

    server.stdout.on('data', (data) => {
      let message = data.toString('utf8');
      let started = /initialization complete/i;

      if (started.test(message)) resolve();
    });
  });
};

const stop = function () {
  if (server) server.kill();
};

module.exports = {
  start: start,
  stop: stop,
};
