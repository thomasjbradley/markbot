'use strict';

const attrs = require('./multi-case-attrs.json');

module.exports = {
  name: 'adv-attr-lowercase',
  desc: 'Attribute name must be lowercase.',
  target: 'parser',

  lint: function (getCfg, parser, reporter) {
    parser.tokenizer.on('attribname', function (name) {
      if (!getCfg()) return;

      if (attrs.indexOf(name.toLowerCase()) > -1) return;

      if (name !== name.toLowerCase()) {
        reporter.warn(
          this._sectionStart,
          '029',
          'Attribute name must be lowercase.'
        );
      }
    });
  }
};
