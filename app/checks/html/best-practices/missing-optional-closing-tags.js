'use strict';

const htmlparser = require('./htmlparser/Parser');
const voidElements = require('./void-elements.json');

const shouldIncludeError = function (tag) {
  if (voidElements.indexOf(tag) > -1) return false;

  return true;
};

module.exports.check = function (fileContents, lines) {
  let errors = [];
  let parser;
  let stack = fileContents.match(/^((?:.|([\n\u0085\u2028\u2029]|\r\n))*?)<body[^>]*>/)[0];

  parser = new htmlparser({
    onopentagname: function (name, attr) {
      stack += '<' + name + '[^>]*>';
    },
    ontext: function (text) {
      stack += text;
    },
    onimpliedclosetag: function (name) {
      if (shouldIncludeError(name)) {
        let errorLines = stack.split(/[\n\u0085\u2028\u2029]|\r\n?/g);
        errors.push(`Line ${errorLines.length - 1}: Missing closing \`</${name}>\` tag`);
      }
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
