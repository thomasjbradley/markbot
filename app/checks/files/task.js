(function () {
  'use strict';

  const fs = require('fs');
  const path = require('path');
  const util = require('util');
  const calipers = require('calipers')('png', 'jpeg');
  const exif = require('exif').ExifImage;
  const pngitxt = require('png-itxt');
  const merge = require('merge-objects');
  const markbotMain = require('electron').remote.require('./app/markbot-main');
  const stripPath = require(__dirname + '/strip-path');
  const exists = require(__dirname + '/file-exists');
  const listDir = require(__dirname + '/list-dir');

  const group = taskDetails.group;
  let totalFiles = 0;

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

    if (!file.maxWidth && !file.maxHeight && !file.minWidth && !file.minHeight) return next(errors);

    calipers.measure(fullPath, function (err, result) {
      if (file.maxWidth) {
        if (result.pages[0].width > file.maxWidth) errors.push(`The width of \`${file.path}\` is too large (expecting: ${file.maxWidth}px, actual: ${result.pages[0].width}px)`);
      }

      if (file.minWidth) {
        if (result.pages[0].width < file.minWidth) errors.push(`The width of \`${file.path}\` is too small (expecting: ${file.minWidth}px, actual: ${result.pages[0].width}px)`);
      }

      if (file.maxHeight) {
        if (result.pages[0].height > file.maxHeight) errors.push(`The height of \`${file.path}\` is too large (expecting: ${file.maxHeight}px, actual: ${result.pages[0].height}px)`);
      }

      if (file.minHeight) {
        if (result.pages[0].height < file.minHeight) errors.push(`The height of \`${file.path}\` is too small (expecting: ${file.minHeight}px, actual: ${result.pages[0].height}px)`);
      }

      next(errors);
    });
  };

  const checkExif = function (file, fullPath, next) {
    new exif({image:fullPath}, function (err, data) {
      if (err && err.code == 'NO_EXIF_SEGMENT' && !data) next([]);
      if (data) next([`The \`${file.path}\` image needs to be smushed`]);
    });
  };

  const checkPngChunks = function (file, fullPath, next) {
    fs.createReadStream(fullPath).pipe(pngitxt.get(function (err, data) {
      if (!err && !data) next([]);

      if (data) next([`The \`${file.path}\` image needs to be smushed`]);
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

  const check = function (folderPath, file, next) {
    const fullPath = path.resolve(`${folderPath}/${file.path}`);
    const fileExists = exists.check(fullPath);

    markbotMain.send('check-group:item-new', group, file.path, file.path);
    markbotMain.send('check-group:item-computing', group, file.path, file.path);

    if (file.hasOwnProperty('exists') && file.exists === false && fileExists) {
      markbotMain.send('check-group:item-complete', group, file.path, file.path, [`The \`${file.path}\` file is unnecessary and should be deleted`]);
      return next();
    }

    if (file.hasOwnProperty('exists') && file.exists === false && !fileExists) {
      markbotMain.send('check-group:item-complete', group, file.path, file.path);
      return next();
    }

    if (!fileExists) {
      markbotMain.send('check-group:item-complete', group, file.path, file.path, [`The \`${file.path}\` file is missing or misspelled`]);
      return next();
    }

    if (isGif(file.path)) {
      markbotMain.send('check-group:item-complete', group, file.path, file.path, [`The \`${file.path}\` image is a GIF — **don’t use GIFs**`]);
      return next();
    }

    if (isImage(file.path)) {
      checkImage(file, fullPath, function (err) {
        if (err) {
          markbotMain.send('check-group:item-complete', group, file.path, file.path, err);
        } else {
          markbotMain.send('check-group:item-complete', group, file.path, file.path);
        }

        next();
      });
    } else {
      checkTextFile(file, fullPath, function (err) {
        if (err) {
          markbotMain.send('check-group:item-complete', group, file.path, file.path, err);
        } else {
          markbotMain.send('check-group:item-complete', group, file.path, file.path);
        }

        next();
      });
    }
  };

  const checkIfDone = function () {
    totalFiles--;

    if (totalFiles <= 0) done();
  };

  taskDetails.options.files.forEach(function (file) {
    if (file.directory) {
      const fullPath = path.resolve(`${taskDetails.cwd}/${file.directory}`);

      if (!exists.check(fullPath)) {
        markbotMain.send('check-group:item-new', group, file.directory, `${file.directory}/`);
        markbotMain.send('check-group:item-complete', group, file.directory, `${file.directory}/`, [`The \`${file.directory}/\` folder is missing or misspelled`]);

        return checkIfDone();
      }

      listDir(fullPath, function(dirFiles) {
        dirFiles.forEach(function (singleFile) {
          let newFileObj = merge(Object.assign({}, file), {path: stripPath(singleFile, taskDetails.cwd)});

          totalFiles++;
          check(taskDetails.cwd, newFileObj, checkIfDone);
        });
      });
    } else {
      totalFiles++;
      check(taskDetails.cwd, file, checkIfDone);
    }
  });
}());
