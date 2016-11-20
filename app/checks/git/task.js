(function () {
  'use strict';

  const path = require('path');
  const markbotMain = require('electron').remote.require('./app/markbot-main');
  const commits = require('./checks/git/commits');
  const status = require('./checks/git/status');

  const fullPath = path.resolve(taskDetails.cwd);

  let checksToComplete = 0;

  const checkIfDone = function () {
    checksToComplete--;

    if (checksToComplete <= 0) done();
  };

  if (taskDetails.options.numCommits) {
    checksToComplete++;
    commits.check(fullPath, taskDetails.options.numCommits, taskDetails.options.ignoreCommitEmails, taskDetails.group, checkIfDone);
  }

  if (taskDetails.options.allCommitted || taskDetails.options.allSynced) {
    checksToComplete++;
    status.check(fullPath, taskDetails.options, taskDetails.group, checkIfDone);
  }
}());
