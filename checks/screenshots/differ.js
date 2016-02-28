'use strict';

var
  fs = require('fs'),
  path = require('path'),
  util = require('util'),
  jimp = require('jimp'),
  checkId,
  checkLabel,
  ALLOWED_DISTANCE_DIFFERENCE = 0.22,
  ALLOWED_PERCENT_DIFFERENCE = 0.13
;

const computing = function () {
  process.send({
    type: 'listener',
    id: 'check-group:item-computing',
    checkId: checkId,
    checkLabel: checkLabel,
    errors: []
  });
};

const refNotFound = function () {
  process.send({
    type: 'listener',
    id: 'check-group:item-complete',
    checkId: checkId,
    checkLabel: checkLabel,
    errors: ['Reference screenshot not found']
  });
};

const newNotFound = function () {
  process.send({
    type: 'listener',
    id: 'check-group:item-complete',
    checkId: checkId,
    checkLabel: checkLabel,
    errors: ['Screenshot of your website not found, please try again']
  });
};

const missing = function () {
  process.send({
    type: 'listener',
    id: 'check-group:item-complete',
    checkId: checkId,
    checkLabel: checkLabel,
    errors: ['The file is missing or misspelled']
  });
};

const bypass = function () {
  process.send({
    type: 'listener',
    id: 'check-group:item-bypass',
    checkId: checkId,
    checkLabel: checkLabel,
    errors: ['Skipped because of previous errors']
  });
};

const compare = function (distance, percent, imgPaths, width) {
  process.send({
    type: 'debug',
    debug: ['distance', distance, 'percent', percent, imgPaths.diff]
  });

  if (distance >= ALLOWED_DISTANCE_DIFFERENCE || percent >= ALLOWED_PERCENT_DIFFERENCE) {
    process.send({
      type: 'listener',
      id: 'check-group:item-complete',
      checkId: checkId,
      checkLabel: checkLabel,
      errors: [{
        type: 'image-diff',
        message: `Too visually different from screenshot`,
        diff: {
          distance: distance,
          percent: percent,
          expectedDistance: ALLOWED_DISTANCE_DIFFERENCE,
          expectedPercent: ALLOWED_PERCENT_DIFFERENCE
        },
        width: width,
        images: {
          ref: `file:///${imgPaths.ref}`,
          new: `file:///${imgPaths.new}`,
          diff: `file:///${imgPaths.diff}`
        }
      }]
    });
  } else {
    process.send({
      type: 'listener',
      id: 'check-group:item-complete',
      checkId: checkId,
      checkLabel: checkLabel,
      errors: []
    });
  }

  process.send({type: 'kill'});
};

const check = function (paths) {
  let diffImgPath;

  computing();

  if (!paths.new) {
    newNotFound();
    return;
  }

  if (!paths.ref) {
    refNotFound();
    return;
  }

  diffImgPath = paths.new.replace(/\.png$/, '-diff.png');

  jimp.read(paths.ref, function (err, refImg) {
    jimp.read(paths.new, function (err, newImg) {
      let distance, diff;

      if (!newImg.bitmap) {
        newNotFound();
        return;
      }

      if (!refImg.bitmap) {
        refNotFound();
        return;
      }

      if (newImg.bitmap.height > refImg.bitmap.height) {
        newImg.crop(0, 0, newImg.bitmap.width, refImg.bitmap.height);
      } else {
        if (refImg.bitmap.height > newImg.bitmap.height) {
          refImg.crop(0, 0, refImg.bitmap.width, newImg.bitmap.height);
        }
      }

      distance = jimp.distance(refImg, newImg);
      diff = jimp.diff(refImg, newImg);
      diff
        .image
        .scan(0, 0, diff.image.bitmap.width, diff.image.bitmap.height, function (x, y, idx) {
          let clr = jimp.intToRGBA(diff.image.getPixelColor(x, y));

          // Yellow
          if (clr.r == 255 && clr.g == 255 && clr.b == !255) {
            diff.image.setPixelColor(0x999999ff, x, y);
          }

          // Red
          if (clr.r == 255 && clr.g == !255 && clr.b == !255) {
            diff.image.setPixelColor(0x000000ff, x, y);
          }
        })
        .write(diffImgPath, function () {
          compare(distance, diff.percent, {
            ref: paths.ref,
            new: paths.new,
            diff: diffImgPath
          }, diff.image.bitmap.width);
        })
        ;
    });
  });
};

const init = function (filePath, size) {
  checkId = filePath + '-' + size;
  checkLabel = filePath + ' — ' + size + 'px';

  process.send({
    type: 'listener',
    id: 'check-group:item-new',
    checkId: checkId,
    checkLabel: checkLabel,
    errors: []
  });
};

process.on('message', function (message) {
  switch (message.type) {
    case 'init':
      init(message.filePath, message.size);
      break;
    case 'check':
      check(message.paths);
      break;
    case 'missing':
      missing();
      break;
    case 'bypass':
      bypass();
      break;
  }
})
