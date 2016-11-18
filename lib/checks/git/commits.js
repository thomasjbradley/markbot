'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const gitCommits = require('git-commits');
const exists = require('../../file-exists');
const markbotMain = require('../../markbot-main');

const matchesProfEmail = function (email, profEmails) {
  return !profEmails.indexOf(email);
};

module.exports.check = function (filePath, commitNum, ignoreCommitEmails, group) {
  var
    repoPath = path.resolve(filePath + '/.git'),
    studentCommits = 0,
    errors = [],
    label = 'Number of commits',
    exists = false
  ;

  markbotMain.send('check-group:item-new', group, 'commits', label);

  try {
    exists = fs.statSync(repoPath).isDirectory();
  } catch (e) {
    exists = false;
  }

  if (!exists) {
    markbotMain.send('check-group:item-complete', group, 'commits', label, ['Not a Git repository']);
    return;
  }

  markbotMain.send('check-group:item-computing', group, 'commits', label);

  gitCommits(repoPath)
    .on('data', function (commit) {
      if (!matchesProfEmail(commit.author.email, ignoreCommitEmails)) studentCommits++;
    })
    .on('end', function () {
      if (studentCommits < commitNum) {
        errors.push(util.format('Not enough commits to the repository (has %d, expecting %d)', studentCommits, commitNum));
      }

      markbotMain.send('check-group:item-complete', group, 'commits', label, errors);
    })
    .on('error', function (err) {
      markbotMain.send('check-group:item-complete', group, 'commits', label, [`Not a Git repository or no commits`]);
    })
  ;
};
