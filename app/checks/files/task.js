(function () {
  'use strict';

  const fs = require('fs');
  const path = require('path');
  const util = require('util');
  const calipers = require('calipers')('png', 'jpeg', 'svg');
  const exif = require('exif').ExifImage;
  const pngitxt = require('png-itxt');
  const imageSize = require('image-size');
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
    return /\.gif$/.test(fileName);
  };

  const isFavicon = function (fileName) {
    return /\.ico$/.test(fileName);
  };

  const isSVG = function (fileName) {
    return /\.svg$/.test(fileName);
  };

  const isImage = function (fileName) {
    return /\.(jpg|jpeg|png|ico)$/.test(fileName);
  };

  const checkFileSize = function (file, fullPath, next) {
    fs.stat(fullPath, function (err, stats) {
      let fsize = Math.ceil(stats.size / 1000);

      if (fsize <= 0) return next([`The \`${file.path}\` file appears empty — there should be content inside`]);
      if (file.maxSize && fsize > file.maxSize) return next([`The file size of \`${file.path}\` is too large (expecting: ${file.maxSize}kB, actual: ${fsize}kB)`]);

      next([]);
    });
  };

  const handleImageDimensionsResults = function (width, height, file) {
    let errors = [];

    if (file.maxWidth) {
      if (width > file.maxWidth) errors.push(`The width of \`${file.path}\` is too large (expecting: ${file.maxWidth}px, actual: ${width}px)`);
    }

    if (file.minWidth) {
      if (width < file.minWidth) errors.push(`The width of \`${file.path}\` is too small (expecting: ${file.minWidth}px, actual: ${width}px)`);
    }

    if (file.maxHeight) {
      if (height > file.maxHeight) errors.push(`The height of \`${file.path}\` is too large (expecting: ${file.maxHeight}px, actual: ${height}px)`);
    }

    if (file.minHeight) {
      if (height < file.minHeight) errors.push(`The height of \`${file.path}\` is too small (expecting: ${file.minHeight}px, actual: ${height}px)`);
    }

    return errors;
  };

  const handleFaviconDimensionsResults = function (dimensions, file) {
    let errors = [];
    let icoSizes = {
      size16: false,
      size32: false,
    };

    if (dimensions.images) {
      for (let img of dimensions.images) {
        if (img.width == 16) icoSizes.size16 = true;
        if (img.width == 32) icoSizes.size32 = true;
      }
    } else {
      if (dimensions.width == 16) icoSizes.size16 = true;
      if (dimensions.width == 32) icoSizes.size32 = true;
    }

    if (!icoSizes.size16) errors.push(`The favicon, \`${file.path}\`, is missing the \`16 × 16\` icon size`);
    if (!icoSizes.size32) errors.push(`The favicon, \`${file.path}\`, is missing the \`32 × 32\` icon size`);

    return errors;
  };

  const checkImageDimensions = function (file, fullPath, next) {
    let errors = [];

    if (!isFavicon(file.path)) {
      if (!file.maxWidth && !file.maxHeight && !file.minWidth && !file.minHeight) return next(errors);
    }

    if (isFavicon(file.path)) {
      imageSize(fullPath, (err, dimensions) => {
        if (err) return next([`Unable to read the image: \`${file.path}\`—try exporting it again`]);
        errors = errors.concat(handleFaviconDimensionsResults(dimensions, file));
        return next(errors);
      });
    } else {
      calipers.measure(fullPath, (err, result) => {
        if (err) return next([`Unable to read the image: \`${file.path}\`—try exporting it again`]);
        errors = errors.concat(handleImageDimensionsResults(result.pages[0].width, result.pages[0].height, file));
        return next(errors);
      });
    }
  };

  const checkSVGImageDimensions = function (file, fullPath, next) {
    let errors = [];

    if (!isSVG(file.path)) return next(errors);
    if (!file.maxWidth && !file.maxHeight && !file.minWidth && !file.minHeight) return next(errors);

    calipers.measure(fullPath, (err, result) => {
      if (err) return next([`Unable to read the image: \`${file.path}\`—try exporting it again`]);
      errors = errors.concat(handleImageDimensionsResults(result.pages[0].width, result.pages[0].height, file));
      return next(errors);
    });
  };

  const checkExif = function (file, fullPath, next) {
    new exif({image:fullPath}, function (err, data) {
      if (err && err.code == 'NO_EXIF_SEGMENT' && !data) return next([]);
      if (data) return next([`The \`${file.path}\` image needs to be smushed`]);
      next([`The JPG, \`${file.path}\`, seems to be corrupt—try exporting it again`]);
    });
  };

  const checkPngChunks = function (file, fullPath, next) {
    fs.createReadStream(fullPath).pipe(pngitxt.get(function (err, data) {
      if (!err && !data) return next([]);

      if (data) next([`The \`${file.path}\` image needs to be smushed`]);
    })).on('error', (err) => {
      next([`The PNG, \`${file.path}\`, seems to be corrupt—try exporting it again`]);
    });
  };

  const checkImageMetadata = function (file, fullPath, next) {
    if (!file.smushed) return next([]);

    if (/\.jpe?g$/.test(file.path)) return checkExif(file, fullPath, next);
    if (/\.png$/.test(file.path)) return checkPngChunks(file, fullPath, next);

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

  const checkFileSmushed = function (file, fullPath, next) {
    if (!file.smushed) return next([]);

    fs.readFile(fullPath, 'utf8', (err, data) => {
      if (!err && !data) next([]);
      if (/[\n\r\u0085\u2028\u2029]/.test(data)) return next([`The \`${file.path}\` file needs to be smushed`]);

      next([]);
    });
  };

  const checkImage = function (file, fullPath, next) {
    let errors = [];

    checkFileSize(file, fullPath, (err) => {
      errors = errors.concat(err);

      checkImageDimensions(file, fullPath, (err) => {
        errors = errors.concat(err);

        checkImageMetadata(file, fullPath, (err) => {
          errors = errors.concat(err);

          next(errors);
        });
      });
    });
  };

  const checkTextFile = function (file, fullPath, next) {
    let errors = [];

    checkFileSize(file, fullPath, (err) => {
      errors = errors.concat(err);

      checkSVGImageDimensions(file, fullPath, (err) => {
        errors = errors.concat(err);

        checkFileSmushed(file, fullPath, (err) => {
          errors = errors.concat(err);

          checkFileContent(file, fullPath, (err) => {
            errors = errors.concat(err);

            next(errors);
          });
        });
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
