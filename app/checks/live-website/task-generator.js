'use strict';

module.exports.generateTaskList = function (markbotFile) {
  var tasks = [];

  if (markbotFile.liveWebsite && markbotFile.repo) {
    let task = {
      group: `live-website-${Date.now()}`,
      groupLabel: 'Live website',
      options: {
        repo: markbotFile.repo,
        username: markbotFile.username,
      },
    };

    tasks.push(task);
  }

  return tasks;
};
