'use strict';

const path = require('path');
const electron = require('electron');
const BrowserWindow = electron.BrowserWindow;
const taskPoolQueue = require('./task-pool-queue');
const appPkg = require('../package.json');

const DEBUG = appPkg.config.DEBUG;

const TYPE_SINGLE = 'type-single';
const TYPE_STATIC = 'type-static';
const TYPE_LIVE = 'type-live';

const PRIORITY_HIGH = 'priority-high';
const PRIORITY_NORMAL = 'priority-normal';
const PRIORITY_LOW = 'priority-low';

const MAX_TASKS = 4;
const MAX_LIVE_TASKS = 1;
const MAX_STATIC_TASKS = MAX_TASKS - MAX_LIVE_TASKS;

let availablePool = {
  single: [],
  static: [],
  live: [],
};
let executingPool = {
  single: {},
  static: {},
  live: {},
};
let taskQueueSingle = taskPoolQueue.create();
let taskQueueStatic = taskPoolQueue.create();
let taskQueueLive = taskPoolQueue.create();

let nextCallback;

const spawnTaskRunner = function () {
  let bw = new BrowserWindow({
    width: 0,
    height: 0,
    show: false,
    x: -100,
    y: -100,
    webPreferences: {
      webSecurity: false
    }
  });

  bw.loadURL('file://' + path.resolve(__dirname + '/task-pool.html'));

  if (DEBUG) {
    bw.webContents.openDevTools({
      mode: 'detach',
    });
  }

  return bw;
};

const executeTaskRunner = function (runner, task) {
  let moduleUrl = path.resolve(__dirname + `/checks/${task.module}/task.js`).replace(/\\/g, '/');
  let taskPoolPath = path.resolve(__dirname + '/task-pool').replace(/\\/g, '/');
  let taskDetailsJson = JSON.stringify(task);

  // All these variables are defined in `app/task-pool.html`
  let js = `
    taskDetails = ${taskDetailsJson};
    tmpScriptElem  = document.createElement('script');
    taskRunnerId = ${runner.id};
    done = function () {
      require('electron').remote.require('${taskPoolPath}').done(${runner.id});
    };

    tmpScriptElem.src = 'file://${moduleUrl}';
    tmpScriptElem.async = true;
    document.body.appendChild(tmpScriptElem);

    console.log('${task.module}');
  `;

  runner.webContents.executeJavaScript(js);
};

const destroyAllSingleTaskRunners = function () {
  availablePool.single.forEach(function(win, i) {
    if (availablePool.single[i]) availablePool.single[i].destroy();
    availablePool.single[i] = null;
  });

  Object.keys(executingPool.single).forEach(function (win) {
    if (executingPool.single[win]) executingPool.single[win].destroy();
    executingPool.single[win] = null;
  });

  availablePool.single = [];
  executingPool.single = {};
};

const destroyAllStaticTaskRunners = function () {
  availablePool.static.forEach(function(win, i) {
    if (availablePool.static[i]) availablePool.static[i].destroy();
    availablePool.static[i] = null;
  });

  Object.keys(executingPool.static).forEach(function (win) {
    if (executingPool.static[win]) executingPool.static[win].destroy();
    executingPool.static[win] = null;
  });

  availablePool.static = [];
  executingPool.static = {};
};

const destroyAllLiveTaskRunners = function () {
  availablePool.live.forEach(function(win, i) {
    if (availablePool.live[i]) availablePool.live[i].destroy();
    availablePool.live[i] = null;
  });

  Object.keys(executingPool.live).forEach(function (win) {
    if (executingPool.live[win]) executingPool.live[win].destroy();
    executingPool.live[win] = null;
  });

  availablePool.live = [];
  executingPool.live = {};
};

const spawnSingleTaskRunner = function () {
  if (availablePool.single.length <= 0) availablePool.single.push(spawnTaskRunner());
};

const spawnAllottedStaticTaskRunners = function () {
  let numRunners = (taskQueueLive.length() <= 0) ? MAX_TASKS : MAX_STATIC_TASKS;

  if (taskQueueStatic.length() < numRunners) numRunners = taskQueueStatic.length();

  while (availablePool.static.length < numRunners) {
    availablePool.static.push(spawnTaskRunner());
  }
};

const spawnAllottedLiveTaskRunners = function () {
  let numRunners = MAX_LIVE_TASKS;

  if (taskQueueLive.length() < numRunners) numRunners = taskQueueLive.length();

  while (availablePool.live.length < numRunners) {
    availablePool.live.push(spawnTaskRunner());
  }
};

const executeAvailableSingleTaskRunner = function () {
  let runner = availablePool.single.pop();
  let task = taskQueueSingle.next();

  if (DEBUG) console.log(`Single process: ${runner.id} -- ${task.module}`);

  executingPool.single[runner.id] = runner;
  executeTaskRunner(executingPool.single[runner.id], task);
};

const executeAvailableStaticTaskRunners = function () {
  while (availablePool.static.length > 0 && taskQueueStatic.has()) {
    let runner = availablePool.static.pop();
    let task = taskQueueStatic.next();

    if (DEBUG) console.log(`Process: ${runner.id} -- ${task.module}`);

    executingPool.static[runner.id] = runner;
    executeTaskRunner(executingPool.static[runner.id], task);
  }
};

const executeAvailableLiveTaskRunners = function () {
  while (availablePool.live.length > 0 && taskQueueLive.has()) {
    let runner = availablePool.live.pop();
    let task = taskQueueLive.next();

    if (DEBUG) console.log(`Process: ${runner.id} -- ${task.module}`);

    executingPool.live[runner.id] = runner;
    executeTaskRunner(executingPool.live[runner.id], task);
  }
};

const addTask = function(queue, task, priority) {
  switch (priority) {
    case PRIORITY_HIGH:
      queue.addStart(task);
      break;
    case PRIORITY_LOW:
      queue.addEnd(task);
      break;
    default:
      queue.add(task);
  }
};

const add = function (task, type = TYPE_STATIC, priority = PRIORITY_NORMAL) {
  switch (type) {
    case TYPE_SINGLE:
      addTask(taskQueueSingle, task, priority);
      break;
    case TYPE_LIVE:
      addTask(taskQueueLive, task, priority);
      break;
    case TYPE_LIVE:
    default:
      addTask(taskQueueStatic, task, priority);
  }
};

const start = function (next) {
  nextCallback = next;

  if (DEBUG) console.log('----- NEW RUN ------');

  if (taskQueueSingle.has()) {
    spawnSingleTaskRunner();
    executeAvailableSingleTaskRunner()
  } else {
    startStaticAndLive();
  }
};

const startStaticAndLive = function () {
  spawnAllottedStaticTaskRunners();
  spawnAllottedLiveTaskRunners();

  executeAvailableStaticTaskRunners();
  executeAvailableLiveTaskRunners();
};

const checkDoneAll = function () {
  // const doneSingleTasks =  (!taskQueueSingle.has() && Object.keys(executingPool.single).length <= 0);
  const doneStaticTasks =  (!taskQueueStatic.has() && Object.keys(executingPool.static).length <= 0);
  const doneLiveTasks = (!taskQueueLive.has() && Object.keys(executingPool.live).length <= 0);

  if (/*doneSingleTasks &&*/ doneStaticTasks && doneLiveTasks) nextCallback();
};

const doneSingle = function (id) {
  if (DEBUG) console.log(`Done: ${id}`);

  if (executingPool.static[id]) {
    availablePool.static.push(executingPool.static[id]);
    delete executingPool.static[id];
  }

  if (taskQueueSingle.has()) {
    executeAvailableSingleTaskRunner();
  } else {
    startStaticAndLive();
  }
};

const doneStatic = function (id) {
  if (DEBUG) console.log(`Done: ${id}`);

  if (executingPool.static[id]) {
    availablePool.static.push(executingPool.static[id]);
    delete executingPool.static[id];
  }

  if (taskQueueStatic.has()) executeAvailableStaticTaskRunners();

  if (!taskQueueStatic.has() && Object.keys(executingPool.static).length <= 0) {
    // if (!DEBUG) destroyAllStaticTaskRunners();
    checkDoneAll();
  }
};

const doneLive = function (id) {
  if (DEBUG) console.log(`Done: ${id}`);

  if (executingPool.live[id]) {
    availablePool.live.push(executingPool.live[id]);
    delete executingPool.live[id];
  }

  if (taskQueueLive.has()) executeAvailableLiveTaskRunners();

  if (!taskQueueLive.has() && Object.keys(executingPool.live).length <= 0) {
    // if (!DEBUG) destroyAllLiveTaskRunners();
    checkDoneAll();
  }
};

const done = function (id) {
  if (executingPool.single[id]) return doneSingle(id);
  if (executingPool.static[id]) return doneStatic(id);
  if (executingPool.live[id]) return doneLive(id);
};

const stop = function () {
  destroyAllSingleTaskRunners();
  destroyAllStaticTaskRunners();
  destroyAllLiveTaskRunners();
};

module.exports = {
  TYPE_SINGLE: TYPE_SINGLE,
  TYPE_STATIC: TYPE_STATIC,
  TYPE_LIVE: TYPE_LIVE,
  PRIORITY_HIGH: PRIORITY_HIGH,
  PRIORITY_NORMAL: PRIORITY_NORMAL,
  PRIORITY_LOW: PRIORITY_LOW,
  add: add,
  start: start,
  done: done,
  stop: stop,
};
