'use strict';

var
  fs = require('fs'),
  util = require('util'),
  exists = require('./file-exists'),
  validation = require('./css/validation'),
  bestPractices = require('./css/best-practices'),
  properties = require('./css/properties'),
  content = require('./css/content')
;

const initChecks = function (listener, file, group) {
  if (file.valid) {
    validation.init(listener, group);
    if (file.bestPractices) bestPractices.init(listener, group);
  }

  if (file.has) properties.init(listener, group);
  if (file.search) content.init(listener, group);
};

const bypassAllChecks = function (file) {
  if (file.valid) validation.bypass();
  if (file.bestPractices) bestPractices.bypass();
  if (file.has) properties.bypass();
  if (file.search) content.bypass();
};

module.exports.check = function (listener, path, file, group) {
  var
    errors = [],
    fullPath = path + '/' + file.path,
    fileContents = ''
  ;

  listener.send('check-group:item-new', group, 'exists', 'Exists');

  initChecks(listener, file, group);

  if (!exists.check(fullPath)) {
    listener.send('check-group:item-complete', group, 'exists', 'Exists', [util.format('The file `%s` is missing or misspelled', file.path)]);
    bypassAllChecks(file);
    return;
  }


  fs.readFile(fullPath, 'utf8', function (err, fileContents) {
    var lines;

    if (fileContents.trim() == '') {
      listener.send('check-group:item-complete', group, 'exists', 'Exists', [util.format('The file `%s` is empty', file.path)]);
      bypassAllChecks(file);
      return;
    }

    listener.send('check-group:item-complete', group, 'exists', 'Exists');
    lines = fileContents.toString().split('\n');

    if (file.valid) {
      validation.check(listener, fullPath, fileContents, lines, function (err) {
        if (!err || err.length <= 0) {
          if (file.bestPractices) bestPractices.check(fullPath, fileContents, lines);
        } else {
          bestPractices.bypass();
        }
      });
    }

    if (file.has) properties.check(fileContents, file.has);
    if (file.search) content.check(fileContents, file.search);
  });
};
