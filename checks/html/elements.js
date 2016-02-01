'use strict';

var
  util = require('util'),
  cheerio = require('cheerio'),
  listener,
  checkGroup,
  checkLabel = 'Required elements',
  checkId = 'elements'
;

module.exports.init = function (lstnr, group) {
  listener = lstnr;
  checkGroup = group;

  listener.send('check-group:item-new', checkGroup, checkId, checkLabel);
};

module.exports.bypass = function () {
  listener.send('check-group:item-bypass', checkGroup, checkId, checkLabel, ['Skipped because of previous errors']);
};

module.exports.check = function (fileContents, sels) {
  var
    $ = null,
    errors = []
  ;

  listener.send('check-group:item-computing', checkGroup, checkId);
  $ = cheerio.load(fileContents);

  sels.forEach(function (sel) {
    if ($(sel).length <= 0) {
      errors.push(util.format('Expected to see this element: `%s`', sel));
    }
  });

  listener.send('check-group:item-complete', checkGroup, checkId, checkLabel, errors);
};
