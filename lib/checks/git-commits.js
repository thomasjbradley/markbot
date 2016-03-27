'use strict';

var
  fs = require('fs'),
  path = require('path'),
  util = require('util'),
  gitCommits = require('git-commits'),
  exists = require('../file-exists')
;

const matchesProfEmail = function (email, profEmails) {
  return !profEmails.indexOf(email);
};

module.exports.check = function (listener, filePath, commitNum, ignoreCommitEmails, group) {
  var
    repoPath = path.resolve(filePath + '/.git'),
    studentCommits = 0,
    errors = [],
    label = 'Number of commits',
    exists = false
  ;

  listener.send('check-group:item-new', group, 'commits', label);

  try {
    exists = fs.statSync(repoPath).isDirectory();
  } catch (e) {
    exists = false;
  }

  if (!exists) {
    listener.send('check-group:item-complete', group, 'commits', label, ['Not a Git repository']);
    return;
  }

  listener.send('check-group:item-computing', group, 'commits', label);

  gitCommits(repoPath)
    .on('data', function (commit) {
      if (!matchesProfEmail(commit.author.email, ignoreCommitEmails)) studentCommits++;
    })
    .on('end', function () {
      if (studentCommits < commitNum) {
        errors.push(util.format('Not enough commits to the repository (has %d, expecting %d)', studentCommits, commitNum));
      }

      listener.send('check-group:item-complete', group, 'commits', label, errors);
    })
    .on('error', function (err) {
      listener.send('check-group:item-complete', group, 'commits', label, [`Not a Git repository or no commits`]);
    })
  ;
};
