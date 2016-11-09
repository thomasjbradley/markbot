'use strict';

const SERVER_PORT = 8080;

const https = require('https');
const pem = require('pem');
const finalhandler = require('finalhandler');
const serveStatic = require('serve-static');

let webServer;
let listener;
let serveStaticDir;

const init = function (lstnr) {
  listener = lstnr;
};

const start = function (dir, next) {
  serveStaticDir = serveStatic(dir);

  if (isRunning()) return next();

  pem.createCertificate({days:1, selfSigned:true}, function(err, keys){
    webServer = https.createServer({key: keys.serviceKey, cert: keys.certificate}, function onRequest (req, res) {
      serveStaticDir(req, res, finalhandler(req, res));
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
  init: init,
  start: start,
  stop: stop,
  isRunning: isRunning,
  getHost: getHost,
};
