'use strict';

var
  util = require('util'),
  cheerio = require('cheerio')
;

module.exports.check = function (fileContents, sels, group, cb) {
  var
    $ = null,
    errors = []
  ;

  cb('elements', group, 'start', 'Required elements');
  $ = cheerio.load(fileContents);

  sels.forEach(function (sel) {
    if ($(sel).length <= 0) {
      errors.push(util.format('Expected to see this element: `%s`', sel));
    }
  });

  cb('elements', group, 'end', 'Required elements', errors);
};
