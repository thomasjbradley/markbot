'use strict';

const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;
const gitState = require('git-state');
const markbotMain = require('electron').remote.require('./app/markbot-main');

module.exports.check = function (fullPath, gitOpts, group, next) {
  const allSynced = 'all-synced';
  const allSyncedLabel = 'Everything synced';
  const allCommitted = 'all-committed';
  const allCommittedLabel = 'Everything committed';
  const errors = ['There was an error getting the status of your Git repository'];
  // const opts = { cwd: fullPath };
  // const cmd = 'git status --porcelain -b';

  let status;

  if (gitOpts.allSynced) {
    markbotMain.send('check-group:item-new', group, allSynced, allSyncedLabel);
    markbotMain.send('check-group:item-computing', group, allSynced, allSyncedLabel);
  }

  if (gitOpts.allCommitted) {
    markbotMain.send('check-group:item-new', group, allCommitted, allCommittedLabel);
    markbotMain.send('check-group:item-computing', group, allCommitted, allCommittedLabel);
  }

  gitState.check(fullPath, function (err, status) {
    if (err) {
      markbotMain.send('check-group:item-complete', group, allSynced, allSyncedLabel, errors);
      markbotMain.send('check-group:item-complete', group, allCommitted, allCommittedLabel, errors);
      return next();
    }

    if (gitOpts.allSynced) {
      if (status.ahead > 0) {
        let plural = (status.ahead === 1) ? '' : 's';
        let isOrAre = (status.ahead === 1) ? 'is' : 'are';

        markbotMain.send('check-group:item-complete', group, allSynced, allSyncedLabel, [`There ${isOrAre} ${status.ahead} commit${plural} waiting to be pushed`]);
      } else {
        markbotMain.send('check-group:item-complete', group, allSynced, allSyncedLabel);
      }
    }

    if (gitOpts.allCommitted) {
      if (status.dirty > 0) {
        let plural = (status.dirty === 1) ? '' : 's';
        let isOrAre = (status.dirty === 1) ? 'is' : 'are';

        markbotMain.send('check-group:item-complete', group, allCommitted, allCommittedLabel, [`There ${isOrAre} ${status.dirty} file${plural} waiting to be committed`]);
      } else {
        markbotMain.send('check-group:item-complete', group, allCommitted, allCommittedLabel);
      }
    }

    next();
  });
};
