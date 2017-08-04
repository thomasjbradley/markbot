'use strict';

const MAX_COMMITS_TO_CHECK = 5;
const MIN_COMMIT_WORDS = 3;
const MIN_COMMIT_CHARS = 10;

const fs = require('fs');
const path = require('path');
const util = require('util');
const is = require('electron-is');
const promisify = require('es6-promisify');
const exec = promisify(require('child_process').exec);
const gitCommits = require('git-commits');
const exists = require(`${__dirname}/../../file-exists`);
const markbotMain = require('electron').remote.require('./app/markbot-main');
const blackListVerbs = require(`${__dirname}/best-practices/black-list-verbs.json`);

let app;

if (is.renderer()) {
  app = require('electron').remote.app;
} else {
  app = require('electron').app;
}

const escapeShell = function (cmd) {
  return '"' + cmd.replace(/(["'$`\\])/g, '\\$1') + '"';
};

const matchesProfEmail = function (email, profEmails) {
  return !profEmails.indexOf(email);
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
  const validatorPath = path.resolve(__dirname.replace(/app.asar[\/\\]/, 'app.asar.unpacked/') + '/../../../vendor/languagetool');
  const fullPath = path.resolve(app.getPath('temp') + `/markbot-commit-${commit.hash}.txt`);
  const execPath = 'java -Dfile.encoding=UTF-8 -jar ' + escapeShell(validatorPath + '/languagetool-commandline.jar') + ' --language en-CA --encoding UTF-8 --json ' + escapeShell(fullPath);

  markbotMain.debug(`@@${fullPath}@@`);
  fs.writeFileSync(fullPath, commit.title, 'utf8');

  return exec(execPath);
};

const checkCommits = function (commits, group, id, label, next) {
  let errors = [];

  Promise.all(
    commits.slice(0, MAX_COMMITS_TO_CHECK).map(checkSpellingAndGrammer)
  ).then((results) => {
    results.forEach((info, i) => {
      let data = false;
      let singleCommitErrors = [];

      if (isLastCharacterPeriod(commits[i].title)) singleCommitErrors.push('The commit message should not end in a period (.) character');
      if (!isCorrectLength(commits[i].title)) singleCommitErrors.push(`The commit message should be at least ${MIN_COMMIT_WORDS} words & ${MIN_COMMIT_CHARS} characters long`);
      if (startsWithWrongTenseVerb(commits[i].title)) singleCommitErrors.push('The commit message should start with a present-tense, imperative verb — pretend all commit messages begin with the phrase “This commit will…”');

      try {
        data = JSON.parse(info);
      } catch (e) {
        errors.push(`Cannot connect to the spelling & grammar checking tool — check that Java is properly installed`);
      }

      if (data && data.matches.length > 0) {
        singleCommitErrors = singleCommitErrors.concat(data.matches.map((match) => {
          return match.message;
        }));
      }

      if (singleCommitErrors.length > 0) {
        errors.push(`The following recent commit message has some errors: **“${commits[i].title}”** ---+++${singleCommitErrors.join('+++')}---`);
      }
    });

    markbotMain.send('check-group:item-complete', group, id, label, errors);
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
