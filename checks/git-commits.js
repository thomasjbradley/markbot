"use strict";

var
  fs = require('fs'),
  util = require('util'),
  gitCommits = require('git-commits'),
  exists = require('./file-exists')
;

const matchesProfEmail = function (email, profEmails) {
  return !profEmails.indexOf(email);
};

module.exports.check = function (path, commitNum, ignoreCommitEmails, group, cb) {
  var
    repoPath = path + '/.git',
    studentCommits = 0,
    errors = [],
    label = 'Number of commits',
    exists = false
  ;

  try {
    exists = fs.statSync(repoPath).isDirectory();
  } catch (e) {
    exists = false;
  }

  if (!exists) {
    cb('commits', group, 'end', label, ['Not a Git repository']);
    return;
  }

  cb('commits', group, 'start', label);

  gitCommits(repoPath)
    .on('data', function (commit) {
      if (!matchesProfEmail(commit.author.email, ignoreCommitEmails)) studentCommits++;
    })
    .on('end', function () {
      if (studentCommits < commitNum) {
        errors.push(util.format('Not enough commits to the repository (has %d, expecting %d)', studentCommits, commitNum));
      }

      cb('commits', group, 'end', label, errors);
    })
  ;
};
