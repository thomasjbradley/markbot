'use strict';

module.exports.generateTaskList = function (markbotFile, isCheater) {
  var tasks = [];

  if (markbotFile.js) {
    markbotFile.js.forEach(function (file) {
      let task = {
        group: `js-${file.path}-${Date.now()}`,
        groupLabel: file.path,
        options: {
          file: file,
          cheater: (isCheater.matches[file.path]) ? isCheater.matches[file.path].equal : false,
        },
      };

      tasks.push(task);
    });
  }

  return tasks;
};
