'use strict';

module.exports.generateTaskList = function (markbotFile) {
  var tasks = [];

  if (markbotFile.functionality) {
    let task = {
      group: `functionality-${Date.now()}`,
      groupLabel: 'Functionality',
      options: {
        files: markbotFile.functionality,
      },
    };

    tasks.push(task);
  }

  return tasks;
};
