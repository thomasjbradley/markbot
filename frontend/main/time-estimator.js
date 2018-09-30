'use strict';

const path = require('path');
const fs = require('fs');
const gitCommits = require('git-commits');

const matchesProfEmail = function (email, profEmails) {
  return profEmails.includes(email);
};

const getFolderStartTime = function (stats) {
  return Math.round(stats.birthtimeMs / 1000);
};

const getFolderEndTime = function (stats) {
  return Math.round(stats.mtimeMs / 1000);
}

const getStartTime = function (stats, commits = []) {
  const folderStart = getFolderStartTime(stats);
  const firstCommit = (commits.length > 0) ? commits[0].author.timestamp : Math.round(Date.now() / 1000);

  return new Date(((folderStart < firstCommit) ? folderStart : firstCommit) * 1000);
};

const getEndTime = function (stats, commits = []) {
  const folderEnd = getFolderEndTime(stats);
  const lastCommit = (commits.length > 0) ? commits[commits.length - 1].author.timestamp : false;

  return new Date(((lastCommit !== false) ? lastCommit : folderEnd) * 1000);
};

const getCommitTimeIntervals = function (commits, hoursThreshold) {
  let commitDates = commits.map((commit) => commit.author.timestamp).sort((a, b) => a - b);
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
  let errorResults = {
    start: new Date(),
    end: new Date(),
    estimatedTime: 1,
    numCommits: false,
  };

  const throwErrorResults = function () {
    next(errorResults);
  };

  fs.stat(repo, (err, stats) => {
    if (err) return throwErrorResults();

    const repoBirthtime = getFolderStartTime(stats);
    const repoMtime = getFolderEndTime(stats);

    errorResults.start = new Date(repoBirthtime * 1000);
    errorResults.end = new Date(repoMtime * 1000);
    errorResults.estimatedTime = parseFloat(Math.round((repoMtime - repoBirthtime) / 60 / 60 * 100) / 100).toFixed(2);

    gitCommits(path.resolve(`${repo}/.git`))
      .on('data', (commit) => {
        if (!matchesProfEmail(commit.author.email, ignoreCommitEmails)) allCommits.push(commit);
      })
      .on('end', () => {
        allCommits.sort((a, b) => a.author.timestamp - b.author.timestamp);

        next({
          start: getStartTime(stats, allCommits),
          end: getEndTime(stats, allCommits),
          estimatedTime: parseFloat(Math.round(calculateCommitTimes(allCommits) / 60 / 60 * 100) / 100).toFixed(2),
          numCommits: allCommits.length,
        });
      })
      .on('error', throwErrorResults)
    ;
  });
};

module.exports = {
  getTimeEstimate: getTimeEstimate,
}
