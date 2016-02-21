'use strict';

var
  fs = require('fs'),
  path = require('path'),
  util = require('util'),
  resemble = require('node-resemble-js'),
  ALLOWABLE_DIFFERENCES = 10 // Percentage defined by Resemble.js
;

const bypass = function (listener, checkGroup, checkId, checkLabel) {
  listener.send('check-group:item-bypass', checkGroup, checkId, checkLabel, ['Skipped because of previous errors']);
};

const check = function (listener, checkGroup, checkId, checkLabel, paths) {
  let diff;

  listener.send('check-group:item-computing', checkGroup, checkId);

  if (!paths.new) {
    listener.send('check-group:item-complete', checkGroup, checkId, checkLabel, ['Screenshot of your website not found']);
    return;
  }

  if (!paths.ref) {
    listener.send('check-group:item-complete', checkGroup, checkId, checkLabel, ['Reference screenshot not found']);
    return;
  }

  diff = resemble(paths.new).compareTo(paths.ref).ignoreAntialiasing().onComplete(function (data) {
    let
      misMatch = Math.ceil(parseFloat(data.misMatchPercentage)),
      diffImgPath = paths.new.replace(/\.png$/, '-diff.png')
      ;

    if (misMatch >= ALLOWABLE_DIFFERENCES) {
      let
        errors = [],
        diffImg = data.getDiffImage(),
        writeStream = fs.createWriteStream(diffImgPath)
      ;

      diffImg.pack().pipe(writeStream);

      writeStream.on('close', function () {
        errors.push({
          type: 'image-diff',
          message: 'Too visually different from screenshot',
          image: 'file:///' + diffImgPath
        });

        listener.send('check-group:item-complete', checkGroup, checkId, checkLabel, errors);
      });
    } else {
      listener.send('check-group:item-complete', checkGroup, checkId, checkLabel, []);
    }
  });
};

module.exports.init = function (lstnr, group, fp, size) {
  return (function (listener, checkGroup, filePath, screenSize) {
    let
      checkId = filePath + '-' + size,
      checkLabel = filePath + ' — ' + size + 'px'
    ;

    listener.send('check-group:item-new', checkGroup, checkId, checkLabel);

    return {
      check: function (paths) {
        check(listener, checkGroup, checkId, checkLabel, paths);
      },
      bypass: function () {
        bypass(listener, checkGroup, checkId, checkLabel);
      }
    };
  }(lstnr, group, fp, size));
};
