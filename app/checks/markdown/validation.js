'use strict';

const path = require('path');
const util = require('util');
const markdownlint = require('markdownlint');
const frontMatter = require('front-matter');
const S = require('string');
const markbotMain = require('electron').remote.require('./app/markbot-main');
const markdownLintConfig = require(`${__dirname}/validation/markdownlint.json`);

const bypass = function (checkGroup, checkId, checkLabel) {
  markbotMain.send('check-group:item-bypass', checkGroup, checkId, checkLabel, ['Skipped because of previous errors']);
};

const check = function (checkGroup, checkId, checkLabel, fullPath, fileContents, next) {
  let filename = path.parse(fullPath).base;
  let fm;
  let errors = [];
  let markdownlintOpts = {
    config: markdownLintConfig,
    strings: {},
  };

  markbotMain.send('check-group:item-computing', checkGroup, checkId);
  markdownlintOpts.strings[filename] = fileContents;

  try {
    fm = frontMatter(fileContents);
  } catch (e) {
    if (e.reason && e.mark) {
      let line = e.mark.line + 1;
      let reason = S(e.reason).humanize();

      errors.push(`Line ${line}: ${reason}`);
    } else {
      let reason = (e.reason) ? ' — ' + S(e.reason).humanize() : '';

      errors.push(`There was a validation error in the YAML front matter${reason}`);
    }
  }

  markdownlint(markdownlintOpts, (err, results) => {
    if (err) errors.push('There was an error validating the Markdown file');

    if (results && results[filename]) {
      results[filename].forEach((item) => {
        let details = (item.errorDetail) ? ` — ${item.errorDetail}` : '';
        let context = (item.errorContext) ? `, near \`${item.errorContext}\`` : '';

        errors.push(`Line ${item.lineNumber}: ${item.ruleDescription}${details}${context}`);
      });
    }

    if (errors.length > 0) {
      errors.unshift({
        type: 'intro',
        message: 'Refer to the Markdown & YAML cheat sheet to help understand these errors:',
        link: 'https://learn-the-web.algonquindesign.ca/topics/markdown-yaml-cheat-sheet/',
        linkText: 'https://mkbt.io/md-yml-cheat-sheet/',
      });
    }

    markbotMain.send('check-group:item-complete', checkGroup, checkId, checkLabel, errors);
    next(errors);
  });
};

module.exports.init = function (group) {
  return (function (g) {
    const checkGroup = g;
    const checkId = 'validation';
    const checkLabel = 'Validation & best practices';

    markbotMain.send('check-group:item-new', checkGroup, checkId, checkLabel);

    return {
      check: function (fullPath, fileContents, next) {
        check(checkGroup, checkId, checkLabel, fullPath, fileContents, next);
      },
      bypass: function () {
        bypass(checkGroup, checkId, checkLabel);
      }
    };
  }(group));
};
