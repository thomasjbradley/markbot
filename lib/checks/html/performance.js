'use strict';

const path = require('path');
const merge = require('merge-objects');
const ipcMain = require('electron').ipcMain;
const webServer = require('../../web-server');
const webLoader = require('../../web-loader');
const webcoach = require('webcoach');
const adviceIgnoreIds = require('./performance/ignore-advice-ids.json');

const perfDefaults = {
  speed: '3G',
  budget: {
    maxLoadTime: 1000,
    maxRequests: 15,
    maxSize: 800,
  }
};

const getPerformanceSettings = function (filePerf) {
  if (filePerf === true) return perfDefaults;

  return merge(perfDefaults, filePerf);
};

const sizeToNum = function (size) {
  let isMb = size.match(/mb/i);
  let num = parseFloat(size.replace(/[^\d\.]/, ''));

  if (isMb) num *= 1024;

  return num;
};

const bypass = function (listener, checkGroup, checkId, checkLabel) {
  listener.send('check-group:item-bypass', checkGroup, checkId, checkLabel, ['Skipped because of previous errors']);
};

const makeJs = function () {
  return `
    (function () {
      const webcoach = nodeRequire('webcoach');

      webcoach.getDomAdvice().then(function (data) {
        nodeRequire('electron').ipcRenderer.send('__markbot-hidden-browser-perf-dom-advice', JSON.stringify(eval(data)));
      });
    }());
  `;
};

const generateBudgetReport = function (perf, advice) {
  const budget = perf.budget;
  let message = `The website passes the performance budget requirements of a simulated ${perf.speed} network`;

  if (!doesPassPerfBudget(perf, advice)) {
    message = `The website fails the performance budget requirements of a simulated ${perf.speed} network`;
  }

  return {
    type: 'table',
    message: message,
    headings: ['', 'Load time', 'Requests', 'Size'],
    rows: [
      {
        title: 'Budget',
        data: [
          `< ${budget.maxLoadTime} ms`,
          `< ${budget.maxRequests}`,
          `< ${budget.maxSize} kB`,
        ],
      },
      {
        title: 'Actual',
        highlight: true,
        data: [
          (advice.timings.fullyLoaded > budget.maxLoadTime) ? `***${Math.round(advice.timings.fullyLoaded)} ms***` : `${Math.round(advice.timings.fullyLoaded)} ms`,
          (advice.info.pageRequests > budget.maxRequests) ? `***${advice.info.pageRequests}***` : advice.info.pageRequests,
          (sizeToNum(advice.info.pageContentSize) > budget.maxSize) ? `***${advice.info.pageContentSize}***` : advice.info.pageContentSize,
        ],
      },
    ],
  };
};

const doesPassPerfBudget = function (perf, advice) {
  const budget = perf.budget;

  if (advice.timings.fullyLoaded > budget.maxLoadTime) return false;
  if (advice.info.pageRequests > budget.maxRequests) return false;
  if (sizeToNum(advice.info.pageContentSize) > budget.maxSize) return false;

  return true;
};

const generateOffendingFileList = function (advice) {
  let error = '';

  if (advice.offending.length > 0) {
    let offending = [];

    advice.offending.forEach(function (file) {
      let simpleFile = file.replace(webServer.getHost(), '');

      offending.push(`\`${simpleFile}\``);
    });

    error += ' ' + offending.join(', ');
  }

  return error;
};

const shouldIncludeError = function (id, advice) {
  if (adviceIgnoreIds.indexOf(id) > -1) return false;
  if (advice.score >= 100) return false;

  if (id == 'fewFonts' && advice.score >= 50) return false;

  return true;
};

const check = function (listener, checkGroup, checkId, checkLabel, folderPath, fullPath, file) {
  let win;
  let har;
  let perf = getPerformanceSettings(file.performance);

  ipcMain.on('__markbot-hidden-browser-perf-dom-advice', function (event, data) {
    var domAdvice = JSON.parse(data);

    ipcMain.removeAllListeners('__markbot-hidden-browser-perf-dom-advice');
    webLoader.destroy(win);

    webcoach.runHarAdvice(webcoach.pickAPage(har, 0), webcoach.getHarAdvice()).then(function (harAdvice) {
      const coachResults = webcoach.merge(domAdvice, harAdvice);
      const coachAdvice = coachResults.advice;
      let errors = [];
      let messages = [];
      let budgetDetails = generateBudgetReport(perf, coachAdvice);

      if (doesPassPerfBudget(perf, coachAdvice)) {
        messages.push(budgetDetails);
      } else {
        errors.push(budgetDetails);
      }

      Object.keys(coachAdvice.performance.adviceList).forEach(function (id) {
        let advice = coachAdvice.performance.adviceList[id];
        let error = `**${advice.title}** — ${advice.advice}`;

        if (shouldIncludeError(id, advice)) {
          error += generateOffendingFileList(advice);
          errors.push(error);
        }
      });

      if (errors.length <= 0) {
        listener.send('check-group:item-complete', checkGroup, checkId, checkLabel, [], '', messages);
      } else {
        listener.send('check-group:item-complete', checkGroup, checkId, checkLabel, errors, '', messages);
      }
    });
  });

  listener.send('check-group:item-computing', checkGroup, checkId, checkLabel);

  webLoader.load(file.path, {speed: perf.speed}, function (theWindow, theHar) {
    win = theWindow;
    har = theHar;
    win.webContents.executeJavaScript(makeJs());
  });
};

module.exports.init = function (lstnr, group) {
  return (function (l, g) {
    let
      listener = l,
      checkGroup = g,
      checkLabel = 'Performance',
      checkId = 'performance'
    ;

    listener.send('check-group:item-new', checkGroup, checkId, checkLabel);

    return {
      check: function (folderPath, filePath, file) {
        check(listener, checkGroup, checkId, checkLabel, folderPath, filePath, file);
      },
      bypass: function () {
        bypass(listener, checkGroup, checkId, checkLabel);
      }
    };
  }(lstnr, group));
};
