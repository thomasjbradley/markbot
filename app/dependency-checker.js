'use strict';

const exec = require('child_process').exec;

let previousCheck = false;

const hasGit = function () {
  return new Promise((resolve, reject) => {
    exec('git --version', (err, data, stderr) => {
      const commandFailed = /command failed/i;
      const licenseRequired = /agree.*xcode.*license/i;
      const unableToFind = /unable.*find.*git.*path/i;

      if (err && commandFailed.test(err)) {
        if (data && licenseRequired.test(data)) {
          // log.error('### Dependency: Git; must agree to license');
          // log.error(data);
          return resolve(false);
        }

        if (data && unableToFind.test(data)) {
          // log.error('### Dependency: Git; not in PATH');
          // log.error(data);
          return resolve(false);
        }
      }

      if (data && data.match(/git version/i)) {
        // log.info('### Dependency: Git; found');
        return resolve(true);
      }

      // log.error('### Dependency: Git; not found');
      return resolve(false);
    });
  });
};

const hasJava = function () {
  return new Promise((resolve, reject) => {
    exec('java -version', (err, data, stderr) => {
      if ((data && data.match(/java version/i)) || (stderr && stderr.match(/java version/i))) {
        // log.info('### Dependency: Java; found');
        return resolve(true);
      }

      // log.error('### Dependency: Java; not found');
      return resolve(false);
    });
  });
};

const check = function (next) {
  if (previousCheck) return next(previousCheck);

  // log.info('## Dependencies');

  Promise.all([
    hasGit(),
    hasJava(),
  ]).then((results) => {
    previousCheck = {
      hasMissingDependencies: (results.includes(false)) ? true : false,
      hasGit: results[0],
      hasJava: results[1],
    };
    next(previousCheck);
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
