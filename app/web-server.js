'use strict';

const DIRECTORY_INDEX = '/index.html';
const HTTPS_KEY = __dirname + '/https-key.pem';
const HTTPS_CERT = __dirname + '/https-cert.pem';

const zlib = require('zlib');
const http = require('http');
const path = require('path');
const fs = require('fs');
const https = require('https');
const is = require('electron-is');
const mimeTypes = require('mime-types');
const portfinder = require('portfinder');
const finalhandler = require('finalhandler');
const exists = require('./file-exists');
const markbotMain = require('./markbot-main');
const appPkg = require('../package.json');

let webServer;
let staticDir;

const isRunning = function () {
  return !!(webServer && webServer.listening);
};

const setHost = function (port) {
  global.localWebServerHost = `https://localhost:${port}`;
};

const getHost = function () {
  if (is.renderer()) {
    return require('electron').remote.getGlobal('localWebServerHost');
  } else {
    return global.localWebServerHost;
  }
};

const start = function (dir, next) {
  staticDir = dir;

  if (isRunning()) return next(getHost());

  fs.readFile(HTTPS_KEY, 'utf8', function(err, httpsKey) {
    fs.readFile(HTTPS_CERT, 'utf8', function(err, httpsCert) {
      webServer = https.createServer({key: httpsKey, cert: httpsCert}, function onRequest (request, response) {
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

          fs.readFile(filePath, function(error, content) {
            if (error) {
              response.writeHead(500);
              response.end();
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
          response.end();
        }
      });

      portfinder.getPort(function (err, port) {
        setHost(port);

        webServer.listen(port, function () {
          next(getHost());
        });
      });
    });
  });
};

const stop = function () {
  if (isRunning()) {
    webServer.close(function () {
      webServer = null;
      staticDir = null;
    });
  }
};

module.exports = {
  start: start,
  stop: stop,
  isRunning: isRunning,
  getHost: getHost,
};
