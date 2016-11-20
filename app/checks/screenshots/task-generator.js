'use strict';

module.exports.generateTaskList = function (markbotFile) {
  var tasks = [];

  if (markbotFile.screenshots) {
    let task = {
      group: `screenshots-${Date.now()}`,
      groupLabel: 'Screenshots',
      options: {
        files: markbotFile.screenshots,
      },
    };

    tasks.push(task);
  }

  return tasks;
};
