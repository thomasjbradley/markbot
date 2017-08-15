'use strict';

const merge = require('merge-objects');
const markbotMain = require('./markbot-main');
const taskPool = require('./task-pool');

const availableChecks = {
  naming: {
    module: 'naming-conventions',
  },
  liveWebsite: {
    module: 'live-website',
  },
  git: {
    module: 'git',
  },
  performance: {
    module: 'performance',
    type: taskPool.TYPE_SINGLE,
    priority: taskPool.PRIORITY_HIGH,
  },
  allFiles: {
    module: 'all-files',
  },
  html: {
    module: 'html',
  },
  css: {
    module: 'css',
  },
  js: {
    module: 'javascript',
  },
  files: {
    module: 'files',
  },
  md: {
    module: 'markdown',
  },
  yml: {
    module: 'yaml',
  },
  functionality: {
    module: 'functionality',
    type: taskPool.TYPE_LIVE,
  },
  screenshots: {
    module: 'screenshots',
    type: taskPool.TYPE_LIVE,
    priority: taskPool.PRIORITY_LOW,
  },
};

const generateTasks = function (check, markbotFile, isCheater) {
  const module = require(`./checks/${check.module}/task-generator`);
  const tasks = module.generateTaskList(markbotFile, isCheater);

  tasks.forEach(function (task, i) {
    markbotMain.send('check-group:new', task.group, task.groupLabel);

    tasks[i] = merge(Object.assign({}, check), tasks[i]);
    tasks[i].cwd = markbotFile.cwd;

    if (!tasks[i].priority) tasks[i].priority = taskPool.PRIORITY_NORMAL;
    if (!tasks[i].type) tasks[i].type = taskPool.TYPE_STATIC;
  });

  return tasks;
};

const run = function (markbotFile, isCheater = null, next) {
  let allTasks = [];

  Object.keys(availableChecks).forEach(function (check) {
    allTasks = allTasks.concat(generateTasks(availableChecks[check], markbotFile, isCheater));
  });

  allTasks.forEach(function (task) {
    taskPool.add(task, task.type, task.priority);
  });

  taskPool.start(next);
};

const stop = function () {
  taskPool.stop();
};

module.exports = {
  run: run,
  stop: stop,
};
