'use strict';

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

      tasks.push(task);
    });
  }

  return tasks;
};
