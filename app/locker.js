'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const yaml = require('js-yaml');
const exists = require('./file-exists');
const markbotMain = require('./markbot-main');

const getHash = function () {
  return crypto.createHash('sha256');
};

const readLockFile = function (filePath) {
  let tmpLocks;

  if (exists.check(filePath)) {
    try {
      tmpLocks = yaml.safeLoad(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      let ln = (e.mark && e.mark.line) ? e.mark.line + 1 : '?';
      markbotMain.debug(`Error in the MarkbotLockFile, line ${ln}: ${e.message}`);
    }

    if (!tmpLocks) tmpLocks = {};
  }

  return tmpLocks;
};

const saveLockFile = function (filePath, locks) {
  fs.writeFileSync(filePath, JSON.stringify(locks, null, 2), 'utf8');
};

const getLockForString = function (str, passcodeHash) {
  return getHash().update(new Buffer(str + passcodeHash, 'utf-8')).digest('hex');
};

const getLockForFile = function (filePath, passcodeHash) {
  let hasher = getHash();

  hasher.update(fs.readFileSync(filePath));
  hasher.update(new Buffer(passcodeHash, 'utf-8'));

  return hasher.digest('hex');
};

module.exports.new = function (passcodeHash) {
  return (function (hash) {
    let locks = {};

    return {
      getLocks: function () {
        return locks;
      },
      reset: function () {
        locks = {};
      },
      read: function (filePath) {
        locks = readLockFile(filePath);
        return locks;
      },
      save: function (filePath) {
        saveLockFile(filePath, locks);
      },
      lockString: function (key, str) {
        locks[key] = getLockForString(str, hash)
      },
      lockFile: function (key, filePath) {
        locks[key] = getLockForFile(filePath, hash);
      }
    };
  }(passcodeHash));
};
