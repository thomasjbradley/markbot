'use strict';

const path = require('path');
const is = require('electron-is');
const {spawn} = require('child_process');

let opts = {
  detached: true,
};

let args = [
  '-cp',
  'languagetool-server.jar',
  'org.languagetool.server.HTTPServer',
  // This makes start-up much, much longer, but the first commit test much shorter
  // It’s currently disabled because I prefer the user experience of faster start-up with slower first commit
  // '--config',
  // 'languagetool.properties',
  '--port',
];

let server;
let app;

if (is.renderer()) {
  app = require('electron').remote.app;
} else {
  app = require('electron').app;
}

const start = function (port) {
  const validatorPath = path.resolve(__dirname.replace(/app.asar[\/\\]/, 'app.asar.unpacked/') + '/../vendor/languagetool');

  args.push(port);
  opts.cwd = validatorPath;

  return new Promise((resolve, reject) => {
    server = spawn('java', args, opts);
    server.unref();

    server.stderr.on('data', (data) => {
      reject(data.toString('utf8'));
    });

    server.stdout.on('data', (data) => {
      let message = data.toString('utf8');
      let started = /server started/i;

      if (started.test(message)) resolve();
    });
  });
};

const stop = function () {
  try {
    server.kill();
  } catch (e) {
    console.log('LanguageTool server already stopped.');
  }
};

module.exports = {
  start: start,
  stop: stop,
};
