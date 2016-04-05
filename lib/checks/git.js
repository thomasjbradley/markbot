'use strict';

const
  commits = require('./git/commits'),
  status = require('./git/status')
  ;

module.exports.check = function (listener, filePath, gitOpts, ignoreCommitEmails, group) {
  if (gitOpts.numCommits) {
    commits.check(listener, filePath, gitOpts.numCommits, ignoreCommitEmails, group);
  }

  if (gitOpts.allCommitted || gitOpts.allSynced) {
    status.check(listener, filePath, gitOpts, group);
  }
};
