'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const gitCommits = require('git-commits');
const exists = require(__dirname + '/../../file-exists');
const markbotMain = require('electron').remote.require('./app/markbot-main');

const matchesProfEmail = function (email, profEmails) {
  return !profEmails.indexOf(email);
};

module.exports.check = function (fullPath, commitNum, ignoreCommitEmails, group, next) {
  const repoPath = path.resolve(fullPath + '/.git');
  const id = 'commits';
  const label = 'Number of commits';
  let studentCommits = 0;
  let errors = [];
  let exists = false;

  markbotMain.send('check-group:item-new', group, id, label);

  try {
    exists = fs.statSync(repoPath).isDirectory();
  } catch (e) {
    exists = false;
  }

  if (!exists) {
    markbotMain.send('check-group:item-complete', group, id, label, ['Not a Git repository']);
    return next();
  }

  markbotMain.send('check-group:item-computing', group, id, label);

  gitCommits(repoPath)
    .on('data', function (commit) {
      if (!matchesProfEmail(commit.author.email, ignoreCommitEmails)) studentCommits++;
    })
    .on('end', function () {
      if (studentCommits < commitNum) {
        errors.push(util.format('Not enough commits to the repository (has %d, expecting %d)', studentCommits, commitNum));
      }

      markbotMain.send('check-group:item-complete', group, id, label, errors);
      next();
    })
    .on('error', function (err) {
      markbotMain.send('check-group:item-complete', group, id, label, [`Not a Git repository or no commits`]);
      next();
    })
  ;
};
