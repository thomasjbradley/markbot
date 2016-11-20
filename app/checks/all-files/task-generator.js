'use strict';

module.exports.generateTaskList = function (markbotFile, isCheater) {
  var tasks = [];

  if (markbotFile.html && markbotFile.allFiles && markbotFile.allFiles.html && markbotFile.allFiles.html.unique) {
    tasks.push({
      group: `html-unique-${Date.now()}`,
      groupLabel: 'All files',
      options: {
        files: markbotFile.html,
        unique: markbotFile.allFiles.html.unique,
      },
    });
  }

  return tasks;
};
