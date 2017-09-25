'use strict';

const MAX_COMMITS_TO_CHECK = 5;
const MIN_COMMIT_WORDS = 3;
const MIN_COMMIT_CHARS = 10;

const fs = require('fs');
const path = require('path');
const util = require('util');
const http = require('http');
const querystring = require('querystring');
const is = require('electron-is');
const gitCommits = require('git-commits');
const exists = require(`${__dirname}/../../file-exists`);
const escapeShell = require(`${__dirname}/../../escape-shell`);
const markbotMain = require('electron').remote.require('./app/markbot-main');
const serverManager = require('electron').remote.require('./app/server-manager');
const blackListVerbs = require(`${__dirname}/best-practices/black-list-verbs.json`);

let app;

if (is.renderer()) {
  app = require('electron').remote.app;
} else {
  app = require('electron').app;
}

const matchesProfEmail = function (email, profEmails) {
  return (profEmails.indexOf(email) > -1);
};

const findSpellingErrorReplacement = function (commit, err) {
  return commit.slice(err.offset, err.offset + err.length);
};

const processCommitText = function (commit, spellingErrorReplacements) {
  spellingErrorReplacements.forEach((replacement) => {
    commit = commit.replace(replacement, `~~${replacement}~~`);
  });

  return commit;
};

const isCorrectLength = function (message) {
  let words = message.trim().split(/\s+/);

  if (words.length < MIN_COMMIT_WORDS || message.length < MIN_COMMIT_CHARS) return false;

  return true;
};

const isLastCharacterPeriod = function (message) {
  return /\.$/.test(message.trim());
};

const startsWithWrongTenseVerb = function (message) {
  let firstWord = message.toLowerCase().trim().split(/\s+/)[0];

  if (blackListVerbs.includes(firstWord)) return true;

  return false;
};

const checkSpellingAndGrammer = function (commit) {
  const hostInfo = serverManager.getHostInfo('language');
  const data = querystring.stringify({
    language: 'en-CA',
    text: commit.title,
  });
  const opts = {
    hostname: hostInfo.hostname,
    port: hostInfo.port,
    path: '/v2/check',
    method: 'POST',
    protocol: `${hostInfo.protocol}:`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(data),
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(opts, (res) => {
      res.setEncoding('utf8');
      res.on('data', resolve);
    });

    req.on('error', reject);
    req.end(data, 'utf8');
  });
};

const checkCommits = function (commits, group, id, label, next) {
  let errors = [];

  Promise.all(
    commits.slice(0, MAX_COMMITS_TO_CHECK).map(checkSpellingAndGrammer)
  ).then((results) => {
    results.forEach((info, i) => {
      let data = false;
      let singleCommitErrors = [];
      let spellingErrorReplacements = [];

      if (isLastCharacterPeriod(commits[i].title)) singleCommitErrors.push('The commit message should not end in a period (.) character');
      if (!isCorrectLength(commits[i].title)) singleCommitErrors.push(`The commit message should be at least ${MIN_COMMIT_WORDS} words & ${MIN_COMMIT_CHARS} characters long`);
      if (startsWithWrongTenseVerb(commits[i].title)) singleCommitErrors.push('The commit message should start with a present-tense, imperative verb — imagine all commit messages begin with the phrase “This commit will…”');

      try {
        data = JSON.parse(info);
      } catch (e) {
        markbotMain.send('check-group:item-complete', group, id, label, [`Cannot connect to the spelling & grammar checking tool — check that Java is properly installed`]);
        return next();
      }

      if (data && data.matches.length > 0) {
        singleCommitErrors = singleCommitErrors.concat(data.matches.map((match) => {
          if (match.rule.issueType = 'misspelling') {
            spellingErrorReplacements.push(findSpellingErrorReplacement(commits[i].title, match));
          }

          return match.message;
        }));
      }

      if (singleCommitErrors.length > 0) {
        let commitText = processCommitText(commits[i].title, spellingErrorReplacements);
        errors.push(`The following recent commit message has some errors: **“${commitText}”** ---+++${singleCommitErrors.join('+++')}---`);
      }
    });

    if (errors.length > 0) {
      errors.unshift({
        type: 'intro',
        message: 'Refer to the Git commit message cheat sheet to help understand these errors:',
        link: 'https://learn-the-web.algonquindesign.ca/topics/commit-message-cheat-sheet/',
        linkText: 'https://mkbt.io/git-cheat-sheet/',
      });
    }

    markbotMain.send('check-group:item-complete', group, id, label, false, false, errors);
    next();
  })
  .catch((reason) => {
    markbotMain.send('check-group:item-complete', group, id, label, [`Cannot connect to the spelling & grammar checking tool — check that Java is properly installed`]);
    return next();
  })
  ;
};

module.exports.check = function (fullPath, ignoreCommitEmails, group, next) {
  const repoPath = path.resolve(fullPath + '/.git');
  const id = 'best-practices';
  const label = 'Best practices';
  let studentCommits = [];
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
    .on('data', (commit) => {
      if (!matchesProfEmail(commit.author.email, ignoreCommitEmails)) studentCommits.push(commit);
    })
    .on('end', () => {
      checkCommits(studentCommits, group, id, label, next);
    })
    .on('error', function (err) {
      markbotMain.send('check-group:item-complete', group, id, label, [`Not a Git repository or no commits`]);
      return next();
    })
  ;
};
