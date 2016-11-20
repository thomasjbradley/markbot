'use strict';

module.exports.generateTaskList = function (markbotFile) {
  var tasks = [];

  if (markbotFile.naming || markbotFile.restrictFileTypes) {
    let task = {
      group: `naming-${Date.now()}`,
      groupLabel: 'Naming & file restrictions',
      options: {},
    };

    if (markbotFile.naming) task.options.naming = true;
    if (markbotFile.restrictFileTypes) task.options.restrictFileTypes = true;

    tasks.push(task);
  }

  return tasks;
};
