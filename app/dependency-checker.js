'use strict';

const exec = require('child_process').exec;

const hasGit = function () {
  return new Promise((resolve, reject) => {
    exec('git --version', (err, data, stderr) => {
      if (data && data.match(/git version/i)) return resolve(true);
      return resolve(false);
    });
  });
};

const hasJava = function () {
  return new Promise((resolve, reject) => {
    exec('java -version', (err, data, stderr) => {
      if ((data && data.match(/java version/i)) || (stderr && stderr.match(/java version/i))) return resolve(true);
      return resolve(false);
    });
  });
};

const check = function (next) {
  Promise.all([
    hasGit(),
    hasJava(),
  ]).then((results) => {
    next({
      hasMissingDependencies: (results.includes(false)) ? true : false,
      hasGit: results[0],
      hasJava: results[1],
    });
  }).catch((e) => {
    next({
      hasMissingDependencies: true,
      hasGit: false,
      hasJava: false,
    });
  });
};

module.exports = {
  check: check,
};
