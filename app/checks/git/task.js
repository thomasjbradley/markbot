(function () {
  'use strict';

  const path = require('path');
  const markbotMain = require('electron').remote.require('./app/markbot-main');
  const commits = require(__dirname + '/checks/git/commits');
  const status = require(__dirname + '/checks/git/status');
  const bestPractices = require(__dirname + '/checks/git/best-practices');

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

  if (taskDetails.options.bestPractices) {
    checksToComplete++;
    bestPractices.check(fullPath, taskDetails.options.ignoreCommitEmails, taskDetails.group, checkIfDone);
  }
}());
