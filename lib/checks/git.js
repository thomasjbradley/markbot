'use strict';

const commits = require('./git/commits');
const status = require('./git/status');

module.exports.check = function (filePath, gitOpts, ignoreCommitEmails, group) {
  if (gitOpts.numCommits) {
    commits.check(filePath, gitOpts.numCommits, ignoreCommitEmails, group);
  }

  if (gitOpts.allCommitted || gitOpts.allSynced) {
    status.check(filePath, gitOpts, group);
  }
};
