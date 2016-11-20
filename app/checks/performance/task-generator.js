'use strict';

module.exports.generateTaskList = function (markbotFile) {
  var tasks = [];

  if (markbotFile.performance) {
    let task = {
      group: `performance-${Date.now()}`,
      groupLabel: 'Performance',
      options: {
        files: markbotFile.performance,
      },
    };

    tasks.push(task);
  }

  return tasks;
};
