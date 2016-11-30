'use strict';

const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;
const gitStatus = require('git-get-status');
const markbotMain = require('electron').remote.require('./app/markbot-main');

module.exports.check = function (fullPath, gitOpts, group, next) {
  const allSynced = 'all-synced';
  const allSyncedLabel = 'Everything synced';
  const allCommitted = 'all-committed';
  const allCommittedLabel = 'Everything committed';
  const errors = ['There was an error getting the status of your Git repository'];
  const opts = { cwd: fullPath };
  const cmd = 'git status --porcelain -b';

  let status;

  if (gitOpts.allSynced) {
    markbotMain.send('check-group:item-new', group, allSynced, allSyncedLabel);
    markbotMain.send('check-group:item-computing', group, allSynced, allSyncedLabel);
  }

  if (gitOpts.allCommitted) {
    markbotMain.send('check-group:item-new', group, allCommitted, allCommittedLabel);
    markbotMain.send('check-group:item-computing', group, allCommitted, allCommittedLabel);
  }

  exec(cmd, opts, function (err, stdout) {
    if (err) {
      markbotMain.send('check-group:item-complete', group, allSynced, allSyncedLabel, errors);
      markbotMain.send('check-group:item-complete', group, allCommitted, allCommittedLabel, errors);
      return next();
    }

    status = gitStatus.parse_status(stdout);

    if (gitOpts.allSynced) {
      if (status.remote_diff !== null) {
        markbotMain.send('check-group:item-complete', group, allSynced, allSyncedLabel, ['There are some commits waiting to be synced']);
      } else {
        markbotMain.send('check-group:item-complete', group, allSynced, allSyncedLabel);
      }
    }

    if (gitOpts.allCommitted) {
      if (!status.clean) {
        markbotMain.send('check-group:item-complete', group, allCommitted, allCommittedLabel, ['There are some files waiting to be committed']);
      } else {
        markbotMain.send('check-group:item-complete', group, allCommitted, allCommittedLabel);
      }
    }

    next();
  });
};
