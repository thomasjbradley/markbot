'use strict';

const ipcRenderer = require('electron').ipcRenderer;
const markbotMain = require('electron').remote.require('./app/markbot-main');
const webLoader = require(`${__dirname}/../../web-loader`);

const warningRules = [
  'href-no-hash',
];

const axeRules = {
  runOnly: {
    type: 'tag',
    values: ['wcag2a', 'wcag2aa', 'section508', 'best-practice']
  },
};

const makeJs = function () {
  return `
    (function () {
      const axeRules = JSON.parse('${JSON.stringify(axeRules)}');
      const axe = window.__markbot.getTestingService('a11y');

      axe.run(document, axeRules, (err, results) => {
        if (err) {
          window.__markbot.sendMessageToWindow(${taskRunnerId}, '__markbot-hidden-browser-a11y-error-${taskRunnerId}', 'There was an error running the accessibility tests—try running Markbot again');
        } else {
          window.__markbot.sendMessageToWindow(${taskRunnerId}, '__markbot-hidden-browser-a11y-advice-${taskRunnerId}', JSON.stringify(results));
        }
      });
    }());
  `;
};

const isErrorWarning = function (err) {
  if (warningRules.includes(err.id)) return true;

  return false;
};

const shouldIgnoreError = function (err) {
  // Ignore aria-details warnings while they're not supported by axe-core
  if (err.id === 'aria-valid-attr') {
    let numNodes = err.nodes.length;

    err.nodes.forEach((node) => {
      if (node.failureSummary.match(/aria-details/)) {
        numNodes--;
      }
    });

    if (numNodes <= 0) return true;
  }

  // Ignore region warnings when they're only concerned with the skip links outside a region
  if (err.id === 'region') {
    if (err.nodes.length > 0 && err.nodes[0].html.match(/\<html/)) {
      let numNodes = 0;

      if (err.nodes[0].any.length > 0 && err.nodes[0].any[0].relatedNodes.length > 0){
        numNodes = err.nodes[0].any[0].relatedNodes.length;

        err.nodes[0].any[0].relatedNodes.forEach((node) => {
          if (node.html.match(/\<a[^>]+href\=\"\#.+(skip|jump)/i)) numNodes--;
        });

        if (numNodes <= 0) return true;
      }
    }
  }

  return false;
};

const shouldIncludeNode = function (node) {
  if (node.failureSummary.match(/aria-details/)) return false;

  return true;
};

const constructErrorMessage = function (err) {
  let allTheNodes = err.nodes.map((node) => {
    if (shouldIncludeNode(node)) return `\`${node.html}\``;
  });
  let errMsg = err.help;
  let message = '';

  switch (err.id) {
    // Helpfully remind users that `tabindex="0"` is necessary on the element skip links point to
    case 'skip-link':
      errMsg += ', the element the skip link points must be focusable, try adding `tabindex="0"` to the element with the matching `id`';
      break;
  }

  message = `${errMsg}; the following elements are affected: ---+++${allTheNodes.join('+++')}---`;

  return message;
};

const constructPositiveMessage = function (numPass, numFail) {
  const total = numPass + numFail;
  const percent = Math.round(100 - ((numFail / total) * 100));
  const passPlural = (numPass === 1) ? '' : 's';
  const failPlural = (numFail === 1) ? '' : 's';

  return {
    type: 'big-number',
    message: 'The website passes many accessibility tests, but there’s always room for improvement — make sure to do some real user testing',
    number: `${percent}%`,
    title: `Passed ${numPass} test${passPlural}`,
    desc: `Failed ${numFail} test${failPlural}`,
    grade: percent,
  };
};

const bypass = function (checkGroup, checkId, checkLabel) {
  markbotMain.send('check-group:item-bypass', checkGroup, checkId, checkLabel, ['Skipped because of previous errors']);
};

const check = function (checkGroup, checkId, checkLabel, taskRunnerId, file, next) {
  let win;

  const cleanup = function () {
    ipcRenderer.removeAllListeners(`__markbot-hidden-browser-a11y-advice-${taskRunnerId}`);
    ipcRenderer.removeAllListeners(`__markbot-hidden-browser-a11y-error-${taskRunnerId}`);
    webLoader.destroy(win);
    win = null;
  };

  ipcRenderer.on(`__markbot-hidden-browser-a11y-advice-${taskRunnerId}`, (event, results) => {
    const a11yResults = JSON.parse(results);
    let errors = [];
    let messages = [];
    let warnings = [];
    let numPasses = a11yResults.passes.length;
    let numFails = a11yResults.violations.length;
    let positiveMessage;

    const introError = {
      type: 'intro',
      message: 'Refer to the accessibility checklist to help understand these errors:',
      link: 'https://learn-the-web.algonquindesign.ca/topics/accessibility-checklist/',
      linkText: 'https://mkbt.io/a11y-checklist/',
    };

    cleanup();

    if (numFails <= 0) {
      messages.push(constructPositiveMessage(numPasses, numFails));
      markbotMain.send('check-group:item-complete', checkGroup, checkId, checkLabel, errors, messages, warnings);
      return next();
    }

    a11yResults.violations.forEach((item) => {
      // DEBUG!
      if (shouldIgnoreError(item)) {
        numPasses++;
        numFails--;
        return;
      }

      if (isErrorWarning(item)) {
        warnings.push(constructErrorMessage(item));
      } else {
        errors.push(constructErrorMessage(item));
      }
    });

    if (warnings.length > 0) warnings.unshift(introError);
    if (errors.length > 0) errors.unshift(introError);

    positiveMessage = constructPositiveMessage(numPasses, numFails);

    if (positiveMessage.grade >= 75) messages.push(positiveMessage);

    markbotMain.send('check-group:item-complete', checkGroup, checkId, checkLabel, errors, messages, warnings);
    next();
  });

  ipcRenderer.on(`__markbot-hidden-browser-a11y-error-${taskRunnerId}`, (event, errMsg) => {
    cleanup();
    markbotMain.send('check-group:item-complete', checkGroup, checkId, checkLabel, [errMsg]);
    next();
  });

  markbotMain.send('check-group:item-computing', checkGroup, checkId);

  webLoader.load(taskRunnerId, file.path, {}, (theWindow) => {
    win = theWindow;
    win.webContents.executeJavaScript(makeJs());
  });
};

module.exports.init = function (group) {
  return (function (g) {
    const checkGroup = g;
    const checkLabel = 'Accessibility';
    const checkId = 'a11y';

    markbotMain.send('check-group:item-new', checkGroup, checkId, checkLabel);

    return {
      check: function (taskRunnerId, file, next) {
        check(checkGroup, checkId, checkLabel, taskRunnerId, file, next);
      },
      bypass: function () {
        bypass(checkGroup, checkId, checkLabel);
      }
    };
  }(group));
};
