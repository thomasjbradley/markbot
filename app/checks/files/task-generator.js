'use strict';

module.exports.generateTaskList = function (markbotFile) {
  var tasks = [];

  if (markbotFile.files) {
    let task = {
      group: `files-${Date.now()}`,
      groupLabel: 'Files & images',
      options: {
        files: markbotFile.files,
      },
    };

    tasks.push(task);
  }

  return tasks;
};
