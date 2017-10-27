'use strict';

const getPort = require('get-port');
const markbotMain = require(`${__dirname}/markbot-main`);
const serverWeb = require(`${__dirname}/server-web`);
const serverHtml = require(`${__dirname}/server-html`);
const serverLanguage = require(`${__dirname}/server-language`);

let serversStarting = false;
let serversRunning = false;

const servers = {
  web: {
    port: 8000,
    protocol: 'https',
  },
  html: {
    port: 8001,
    protocol: 'http',
  },
  language: {
    port: 8002,
    protocol: 'http',
  },
};

const setPorts = function (ports) {
  servers.web.port = ports[0];
  servers.html.port = ports[1];
  servers.language.port = ports[2];
};

const start = function (next) {
  if (serversRunning) return next();
  if (serversStarting) return;

  serversStarting = true;

  Promise.all([
    getPort(),
    getPort(),
    getPort(),
  ]).then((ports) => {
    setPorts(ports);

    Promise.all([
      serverWeb.start(servers.web.port),
      serverHtml.start(servers.html.port),
      serverLanguage.start(servers.language.port),
    ]).then(() => {
      serversRunning = true;
      next();
    }).catch((reason) => {
      markbotMain.send('restart', `Internal servers won’t start: “${reason}”. Please quit & restart Markbot.`);
    });
  });
};

const stop = function () {
  serversStarting = false;
  serversRunning = false;
  serverWeb.stop();
  serverHtml.stop();
  serverLanguage.stop();
};

const getHost = function (server) {
  if (!servers[server]) return false;

  return `${servers[server].protocol}://127.0.0.1:${servers[server].port}`;
};

const getHostInfo = function (server) {
  if (!servers[server]) return false;

  return {
    hostname: '127.0.0.1',
    port: servers[server].port,
    protocol: servers[server].protocol,
  };
};

const getServer = function (server) {
  switch (server) {
    case 'web':
      return serverWeb;
      break;
    case 'html':
      return serverHtml;
      break;
    case 'language':
      return serverLanguage;
      break;
    default:
      return false;
  }
};

module.exports = {
  start: start,
  stop: stop,
  getHost: getHost,
  getHostInfo: getHostInfo,
  getServer: getServer,
};
