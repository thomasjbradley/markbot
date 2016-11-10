'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const calipers = require('calipers')('png', 'jpeg');
const exif = require('exif').ExifImage;
const pngitxt = require('png-itxt');
const exists = require('../file-exists');

const cleanRegex = function (regex) {
  return regex.replace(/\\(?!\\)/g, '');
};

const isGif = function (fileName) {
  return fileName.match(/\.gif$/);
};

const isImage = function (fileName) {
  return fileName.match(/\.(jpg|jpeg|png)$/);
};

const checkFileSize = function (file, fullPath, next) {
  fs.stat(fullPath, function (err, stats) {
    let fsize = Math.ceil(stats.size / 1000);

    if (fsize <= 0) return next([`The \`${file.path}\` file appears empty — there should be content inside`]);
    if (file.maxSize && fsize > file.maxSize) return next([`The file size of \`${file.path}\` is too large (expecting: ${file.maxSize}kB, actual: ${fsize}kB)`]);

    next([]);
  });
};

const checkImageDimensions = function (file, fullPath, next) {
  let errors = [];

  if (!file.maxWidth && !file.maxHeight) return next(errors);

  calipers.measure(fullPath, function (err, result) {
    if (file.maxWidth) {
      if (result.pages[0].width > file.maxWidth) errors.push(`The width of \`${file.path}\` is too large (expecting: ${file.maxWidth}px, actual: ${result.pages[0].width}px)`);
    }

    if (file.maxHeight) {
      if (result.pages[0].height > file.maxHeight) errors.push(`The height of \`${file.path}\` is too large (expecting: ${file.maxHeight}px, actual: ${result.pages[0].height}px)`);
    }

    next(errors);
  });
};

const checkExif = function (file, fullPath, next) {
  new exif({image:fullPath}, function (err, data) {
    if (err && err.code == 'NO_EXIF_SEGMENT' && !data) next([]);
    if (data) next([`The \`${file.path}\` image needs to be smushed with a tool like ImageOptim`]);
  });
};

const checkPngChunks = function (file, fullPath, next) {
  fs.createReadStream(fullPath).pipe(pngitxt.get(function (err, data) {
    if (!err && !data) next([]);

    if (data) next([`The \`${file.path}\` image needs to be smushed with a tool like ImageOptim`]);
  }));
};

const checkImageMetadata = function (file, fullPath, next) {
  if (!file.smushed) return next([]);

  if (file.path.match(/\.jpe?g$/)) return checkExif(file, fullPath, next);
  if (file.path.match(/\.png$/)) return checkPngChunks(file, fullPath, next);

  next([]);
};

const findSearchErrors = function (fileContents, search) {
  let errors = [];

  search.forEach(function (regex) {
    let re = regex, error;

    if (typeof regex == 'object') {
      re = regex[0];
      error = regex[1];
    } else {
      error = `Expected to see this content: \`${cleanRegex(regex)}\``;
    }

    if (!fileContents.match(new RegExp(re, 'gm'))) {
      errors.push(error);
    }
  });

  return errors;
};

const findSearchNotErrors = function (fileContents, searchNot) {
  let errors = [];

  searchNot.forEach(function (regex) {
    let re = regex, error;

    if (typeof regex == 'object') {
      re = regex[0];
      error = regex[1];
    } else {
      error = `Unexpected \`${cleanRegex(regex)}\` — \`${cleanRegex(regex)}\` should not be used`;
    }

    if (fileContents.match(new RegExp(re, 'gm'))) {
      errors.push(error);
    }
  });

  return errors;
};

const checkFileContent = function (file, fullPath, next) {
  let errors = [];

  fs.readFile(fullPath, 'utf8', function (err, fileContents) {
    if (file.search) errors = errors.concat(findSearchErrors(fileContents, file.search));
    if (file.searchNot) errors = errors.concat(findSearchNotErrors(fileContents, file.searchNot));

    next(errors);
  });
};

const checkImage = function (file, fullPath, next) {
  let errors = [];

  checkFileSize(file, fullPath, function (err) {
    errors = errors.concat(err);

    checkImageDimensions(file, fullPath, function (err) {
      errors = errors.concat(err);

      checkImageMetadata(file, fullPath, function (err) {
        errors = errors.concat(err);

        next(errors);
      });
    });
  });
};

const checkTextFile = function (file, fullPath, next) {
  let errors = [];

  checkFileSize(file, fullPath, function (err) {
    errors = errors.concat(err);

    checkFileContent(file, fullPath, function (err) {
      errors = errors.concat(err);

      next(errors);
    });
  });
};

module.exports.check = function (listener, filePath, file, group) {
  const fullPath = path.resolve(`${filePath}/${file.path}`);

  listener.send('check-group:item-new', group, file.path, file.path);
  listener.send('check-group:item-computing', group, file.path, file.path);

  if (!exists.check(fullPath)) {
    listener.send('check-group:item-complete', group, file.path, file.path, [`The \`${file.path}\` file is missing or misspelled`]);
    return;
  }

  if (isGif(file.path)) {
    listener.send('check-group:item-complete', group, file.path, file.path, [`The \`${file.path}\` image is a GIF — **don’t use GIFs**`]);
    return;
  }

  if (isImage(file.path)) {
    checkImage(file, fullPath, function (err) {
      if (err) {
        listener.send('check-group:item-complete', group, file.path, file.path, err);
      } else {
        listener.send('check-group:item-complete', group, file.path, file.path);
      }
    });
  } else {
    checkTextFile(file, fullPath, function (err) {
      if (err) {
        listener.send('check-group:item-complete', group, file.path, file.path, err);
      } else {
        listener.send('check-group:item-complete', group, file.path, file.path);
      }
    });
  }
};