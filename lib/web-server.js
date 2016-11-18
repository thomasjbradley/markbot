'use strict';

const SERVER_PORT = 8080;
const DIRECTORY_INDEX = '/index.html';

var zlib = require('zlib');
var http = require('http');
var path = require('path');
var fs = require('fs');
const https = require('https');
const pem = require('pem');
var mimeTypes = require('mime-types');
const finalhandler = require('finalhandler');
const exists = require('./file-exists');
const markbotMain = require('./markbot-main');

let webServer;
let staticDir;

const start = function (dir, next) {
  staticDir = dir;

  if (isRunning()) return next();

  pem.createCertificate({days:1, selfSigned:true}, function(err, keys){
    webServer = https.createServer({key: keys.serviceKey, cert: keys.certificate}, function onRequest (request, response) {
      if (request.url.indexOf('?') > -1) request.url = request.url.substr(0, request.url.indexOf('?'));
      if (request.url == '/') request.url = DIRECTORY_INDEX;

      let filePath = path.resolve(staticDir + request.url);
      let extname = path.extname(filePath);
      let acceptEncoding = request.headers['accept-encoding'];

      if (!acceptEncoding) acceptEncoding = '';

      if (exists.check(filePath)) {
        let mime = mimeTypes.contentType(path.extname(filePath));
        let headers = {
          'Last-Modified': fs.statSync(filePath).mtime,
          'Cache-Control': 'max-age=2592000', // 30 days
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

    webServer.listen(SERVER_PORT, function () {
      next();
    });
  });
};

const stop = function () {
  if (isRunning()) {
    webServer.close(function () {
      webServer = null;
      serveStaticDir = null;
    });
  }
};

const isRunning = function () {
  return (webServer && webServer.listening);
};

const getHost = function () {
  return `https://localhost:${SERVER_PORT}`;
};

module.exports = {
  start: start,
  stop: stop,
  isRunning: isRunning,
  getHost: getHost,
};
