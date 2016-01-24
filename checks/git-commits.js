"use strict";

var
  fs = require('fs'),
  util = require('util'),
  gitCommits = require('git-commits'),
  exists = require('./file-exists')
;

const matchesProfEmail = function (email) {
  return ![
    'hey@thomasjbradley.ca',
    'theman@thomasjbradley.ca',
    'bradlet@thomasjbradley.ca'
  ].indexOf(email);
};

module.exports.check = function (path, commitNum, group, cb) {
  var
    repoPath = path + '/.git',
    studentCommits = 0,
    errors = [],
    label = 'Number of commits'
  ;

  if (!fs.statSync(repoPath).isDirectory()) {
    cb('commits', group, 'end', label, ['Not a Git repository']);
    return;
  }

  cb('commits', group, 'start', label);

  gitCommits(repoPath)
    .on('data', function (commit) {
      if (!matchesProfEmail(commit.author.email)) studentCommits++;
    })
    .on('end', function () {
      if (studentCommits < commitNum) {
        errors.push(util.format('Not enough commits to the repository (has %d, expecting %d)', studentCommits, commitNum));
      }

      cb('commits', group, 'end', label, errors);
    })
  ;
};
