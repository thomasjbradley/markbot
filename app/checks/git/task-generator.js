'use strict';

let config = require('../../../config.json');

module.exports.generateTaskList = function (markbotFile) {
  var tasks = [];

  if (markbotFile.commits || markbotFile.git) {
    let task = {
      group: `git-${Date.now()}`,
      groupLabel: 'Git & GitHub',
      options: {},
    };

    if (!markbotFile.git && markbotFile.commits) {
      task.options = {
        numCommits: markbotFile.commits,
      };
    } else {
      task.options = markbotFile.git;
    }

    task.options.ignoreCommitEmails = config.ignoreCommitEmails;

    tasks.push(task);
  }

  return tasks;
};
