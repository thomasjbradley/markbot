'use strict';

const
  util = require('util'),
  htmlparser = require('./htmlparser/Parser')
;

module.exports.check = function (fileContents, lines) {
  var
    errors = [],
    parser,
    stack = fileContents.match(/^((?:.|([\n\u0085\u2028\u2029]|\r\n))*?)<body[^>]*>/)[0]
  ;

  parser = new htmlparser({
    onopentagname: function (name, attr) {
      stack += '<' + name + '[^>]*>';
    },
    ontext: function (text) {
      stack += text;
    },
    onimpliedclosetag: function (name) {
      var errorLines = stack.split(/[\n\u0085\u2028\u2029]|\r\n?/g);
      errors.push(util.format('Line %d: Missing closing %s tag', errorLines.length - 1, name));
    },
    onclosetag: function (name) {
      stack += '</' + name + '[^>]*>';
    }
  }, {
    decodeEntities: true,
    lowerCaseTags: true
  });

  parser.write(fileContents.match(/<body[^>]*>((?:.|([\n\u0085\u2028\u2029]|\r\n))*?)<\/body>/im)[1]);
  parser.end();

  return errors;
};
