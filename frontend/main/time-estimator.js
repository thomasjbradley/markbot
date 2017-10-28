'use strict';

const path = require('path');
const gitCommits = require('git-commits');

const matchesProfEmail = function (email, profEmails) {
  return profEmails.includes(email);
};

const getCommitTimeIntervals = function (commits, hoursThreshold) {
  let commitDates = commits.map((commit) => commit.author.timestamp).sort();
  let totalDates = commitDates.length;
  let intervals = [];

  hoursThreshold = hoursThreshold * 60 * 60;

  for (let i = 1; i < totalDates; i++) {
    let timeDiff = commitDates[i] - commitDates[i - 1];
    if (timeDiff <= hoursThreshold) {
      intervals.push(timeDiff);
    } else {
      // Add .5 hour extra for large gaps in time
      intervals.push(.5 * 60 * 60);
    }
  }

  return intervals;
};

const calculateCommitTimes = function (commits, hoursThreshold = 2) {
  return getCommitTimeIntervals(commits, hoursThreshold).reduce((sum, val) => sum + Math.abs(val), 0);
};

const getTimeEstimate = function (repo, ignoreCommitEmails, next) {
  let allCommits = [];

  gitCommits(path.resolve(`${repo}/.git`))
    .on('data', (commit) => {
      if (!matchesProfEmail(commit.author.email, ignoreCommitEmails)) allCommits.push(commit);
    })
    .on('end', () => {
      next({
        estimatedTime: parseFloat(Math.round(calculateCommitTimes(allCommits) / 60 / 60 * 100) / 100).toFixed(2),
        numCommits: allCommits.length,
      });
    })
    .on('error', (err) => {
      next({
        estimatedTime: 1,
        numCommits: 2,
      });
    })
  ;
}

module.exports = {
  getTimeEstimate: getTimeEstimate,
}
