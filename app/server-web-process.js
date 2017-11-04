'use strict';

const DIRECTORY_INDEX = '/index.html';
const HTTPS_KEY = `${__dirname}/https-key.pem`;
const HTTPS_CERT = `${__dirname}/https-cert.pem`;

const zlib = require('zlib');
const path = require('path');
const fs = require('fs');
const https = require('https');
const mimeTypes = require('mime-types');
const finalhandler = require('finalhandler');
const exists = require('./file-exists');
const pkg = require('../package');

const errorView = path.resolve(`${__dirname}/server-web-error.html`);

let webServer;
let staticDir = path.resolve(__dirname.replace(/app.asar[\/\\]/, 'app.asar.unpacked/') + '/../http-public');

const getErrorPage = function (errcode) {
  return fs
    .readFileSync(errorView, 'utf-8')
    .replace(/{{errno}}/g, errcode)
    .replace(/{{markbotversion}}/g, pkg.version)
    ;
};

const isRunning = function () {
  return !!(webServer && webServer.listening);
};

const start = function (port) {
  fs.readFile(HTTPS_KEY, 'utf8', (err, httpsKey) => {
    fs.readFile(HTTPS_CERT, 'utf8', (err, httpsCert) => {
      webServer = https.createServer({key: httpsKey, cert: httpsCert}, (request, response) => {
        if (request.url.indexOf('?') > -1) request.url = request.url.substr(0, request.url.indexOf('?'));
        if (request.url == '/') request.url = DIRECTORY_INDEX;

        let filePath = path.resolve(staticDir + request.url);
        let extname = path.extname(filePath);
        let acceptEncoding = request.headers['accept-encoding'];

        if (!acceptEncoding) acceptEncoding = '';

        if (exists.check(filePath)) {
          let mime = mimeTypes.contentType(path.extname(filePath));
          let headers = {
            // 'Last-Modified': fs.statSync(filePath).mtime,
            // 'Cache-Control': 'max-age=2592000', // 30 days
          };

          if (mime) headers['Content-Type'] = mime;

          fs.readFile(filePath, (error, content) => {
            if (error) {
              response.writeHead(404);
              response.end(getErrorPage(404), 'utf-8');
            } else {
              let raw = fs.createReadStream(filePath);

              if (acceptEncoding.match(/\bdeflate\b/)) {
                headers['Content-Encoding'] = 'deflate';
                response.writeHead(200, headers);
                raw.pipe(zlib.createDeflate()).pipe(response);
              } else if (acceptEncoding.match(/\bgzip\b/)) {
                headers['Content-Encoding'] = 'gzip';
                response.writeHead(200, headers);
                raw.pipe(zlib.createGzip()).pipe(response);
              } else {
                response.writeHead(200, headers);
                raw.pipe(response);
              }
            }
          });
        } else {
          response.writeHead(404);
          response.end(getErrorPage(404), 'utf-8');
        }
      });

      webServer.listen(port, () => {
        process.send({ running: true });
      });
    });
  });
};

const stop = function () {
  try {
    webServer.close();
    webServer = null;
    staticDir = null;
    process.kill();
  } catch (e) {
    console.log('Web server is already stopped.');
  }
};

const setRoot = function (dir) {
  staticDir = dir;
};

process.on('message', (msg) => {
  if (msg.start) start(msg.start);
  if (msg.stop) stop();
  if (msg.root) setRoot(msg.root);
});
