'use strict';

const
  fs = require('fs'),
  path = require('path'),
  exec = require('child_process').exec,
  gitStatus = require('git-get-status')
  ;

module.exports.check = function (listener, filePath, gitOpts, group) {
  const
    allSynced = 'all-synced',
    allSyncedLabel = 'Everything synced',
    allCommitted = 'all-committed',
    allCommittedLabel = 'Everything committed',
    errors = ['There was an error getting the status of your Git repository'],
    opts = {
      cwd: filePath
    },
    cmd = 'git status --porcelain -b'
    ;

  let status;

  if (gitOpts.allSynced) {
    listener.send('check-group:item-new', group, allSynced, allSyncedLabel);
    listener.send('check-group:item-computing', group, allSynced, allSyncedLabel);
  }

  if (gitOpts.allCommitted) {
    listener.send('check-group:item-new', group, allCommitted, allCommittedLabel);
    listener.send('check-group:item-computing', group, allCommitted, allCommittedLabel);
  }

  exec(cmd, opts, function (err, stdout) {
    if (err) {
      listener.send('check-group:item-complete', group, allSynced, allSyncedLabel, errors);
      listener.send('check-group:item-complete', group, allCommitted, allCommittedLabel, errors);
    }

    status = gitStatus.parse_status(stdout);

    if (gitOpts.allSynced) {
      if (status.remote_diff !== null) {
        listener.send('check-group:item-complete', group, allSynced, allSyncedLabel, ['There are some files waiting to be committed']);
      } else {
        listener.send('check-group:item-complete', group, allSynced, allSyncedLabel);
      }
    }

    if (gitOpts.allCommitted) {
      if (!status.clean) {
        listener.send('check-group:item-complete', group, allCommitted, allCommittedLabel, ['There are some commits waiting to be synced']);
      } else {
        listener.send('check-group:item-complete', group, allCommitted, allCommittedLabel);
      }
    }
  });
};
