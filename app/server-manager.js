'use strict';

const getPort = require('get-port');
const markbotMain = require(`${__dirname}/markbot-main`);
const serverHtml = require(`${__dirname}/server-html`);
const serverLanguage = require(`${__dirname}/server-language`);

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

  Object.keys(servers).forEach((key) => {
    markbotMain.send('debug', `Server “${key}”: ` + getHost(key));
  });
};

const start = function (next) {
  Promise.all([
    getPort(),
    getPort(),
    getPort(),
  ]).then((ports) => {
    setPorts(ports);

    Promise.all([
      serverHtml.start(servers.html.port),
      serverLanguage.start(servers.language.port),
    ]).then(() => {
      next();
    }).catch((reason) => {
      markbotMain.send('alert', `Internal servers won’t start: “${reason}” — try restarting Markbot`);
    });
  });
};

const getHost = function (server) {
  if (!servers[server]) return false;

  return `${servers[server].protocol}://localhost:${servers[server].port}`;
};

const getHostInfo = function (server) {
  if (!servers[server]) return false;

  return {
    hostname: 'localhost',
    port: servers[server].port,
    protocol: servers[server].protocol,
  };
};

const stopAll = function () {
  serverLanguage.stop();
  serverHtml.stop();
};

module.exports = {
  start: start,
  stopAll: stopAll,
  getHost: getHost,
  getHostInfo: getHostInfo,
};
