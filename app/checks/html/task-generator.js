'use strict';

const taskPool = require(`${__dirname}/../../task-pool`);

module.exports.generateTaskList = function (markbotFile, isCheater) {
  var tasks = [];

  if (markbotFile.html) {
    markbotFile.html.forEach(function (file) {
      let task = {
        group: `html-${file.path}-${Date.now()}`,
        groupLabel: file.path,
        options: {
          file: file,
          cheater: (isCheater.matches[file.path]) ? !isCheater.matches[file.path].equal : (isCheater.cheated) ? true : false,
        },
      };

      if (file.accessibility) {
        task.type = taskPool.TYPE_LIVE;
      } else {
        task.type = taskPool.TYPE_STATIC;
      }

      tasks.push(task);
    });
  }

  return tasks;
};
