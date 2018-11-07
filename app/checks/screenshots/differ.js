'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const jimp = require('jimp');
const ALLOWED_DISTANCE_DIFFERENCE = 0.50;

let checkId;
let checkLabel;

const newNotFound = function () {
  process.send({
    type: 'listener',
    id: 'check-group:item-complete',
    checkId: checkId,
    checkLabel: checkLabel,
    errors: ['Screenshot of your website not found, please try again']
  });
};

const getDiffPercentByArea = function (width, height) {
  let area = width * height;

  if (area < 1000000) return 0.13;
  if (area >= 1000000 && area < 3000000) return 0.12;
  if (area >= 3000000 && area < 6000000) return 0.11;
  if (area >= 6000000) return 0.10;
};

const compare = function (distance, percent, allowedDiff, imgPaths, width, height) {
  let allowedPercentDifference = allowedDiff || getDiffPercentByArea(width, height);

  process.send({
    type: 'debug',
    debug: ['distance', distance, 'percent', percent, `@@${imgPaths.diff}@@`]
  });

  if (distance >= ALLOWED_DISTANCE_DIFFERENCE || percent >= allowedPercentDifference) {
    process.send({
      type: 'listener',
      id: 'check-group:item-complete',
      checkId: checkId,
      checkLabel: checkLabel,
      errors: [{
        type: 'image-diff',
        message: 'Too visually different from screenshot',
        diff: {
          distance: distance,
          percent: percent,
          expectedDistance: ALLOWED_DISTANCE_DIFFERENCE,
          expectedPercent: allowedPercentDifference
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
      errors: [],
      messages: [{
        type: 'image-diff',
        message: 'Screenshots match within acceptable limits',
        diff: {
          distance: distance,
          percent: percent,
          expectedDistance: ALLOWED_DISTANCE_DIFFERENCE,
          expectedPercent: allowedPercentDifference
        },
        width: width,
        images: {
          ref: `file:///${imgPaths.ref}`,
          new: `file:///${imgPaths.new}`,
          diff: `file:///${imgPaths.diff}`
        }
      }]
    });
  }

  process.send({type: 'kill'});
};

const calculateImageDifference = function (paths, refImg, newImg, allowedDiff) {
  let diffImgPath = paths.new.replace(/\.png$/, '-diff.png');
  let distance = jimp.distance(refImg, newImg);
  let diff = jimp.diff(refImg, newImg);

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
      compare(distance, diff.percent, allowedDiff, {
        ref: paths.ref,
        new: paths.new,
        diff: diffImgPath
      }, diff.image.bitmap.width, diff.image.bitmap.height);
    })
    ;
};

const resizeImagesToMatchHeight = function (paths, refImg, newImg, allowedDiff) {
  if (newImg.bitmap.height != refImg.bitmap.height) {
    let tmpImgHeight = (newImg.bitmap.height > refImg.bitmap.height) ? newImg.bitmap.height : refImg.bitmap.height;

    new jimp(refImg.bitmap.width, tmpImgHeight, 0xff00ffff, function (err, rightLengthImg) {
      if (newImg.bitmap.height > refImg.bitmap.height) {
        rightLengthImg.composite(refImg, 0, 0);
        calculateImageDifference(paths, rightLengthImg, newImg, allowedDiff);
      } else {
        rightLengthImg.composite(newImg, 0, 0);
        calculateImageDifference(paths, refImg, rightLengthImg, allowedDiff);
      }
    });
  } else {
    calculateImageDifference(paths, refImg, newImg, allowedDiff);
  }
};

const check = function (paths, allowedDiff = false) {
  if (!paths.new) {
    newNotFound();
    return;
  }

  jimp.read(paths.ref, function (err, refImg) {
    jimp.read(paths.new, function (err, newImg) {
      if (!newImg.bitmap) {
        newNotFound();
        return;
      }

      resizeImagesToMatchHeight(paths, refImg, newImg, allowedDiff);
    });
  });
};

const init = function (filename, width) {
  const suffix = (width === 'print') ? '' : 'px';
  checkId = `${filename}-${width}`;
  checkLabel = `${filename} — ${width}${suffix}`;
};

process.on('message', function (message) {
  switch (message.type) {
    case 'init':
      init(message.filename, message.width);
      break;
    case 'check':
      check(message.paths, message.allowedDiff);
      break;
  }
})
