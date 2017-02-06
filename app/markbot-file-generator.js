'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
// const dir = require('node-dir');
const merge = require('merge-objects');
const glob = require('glob');

const markbotIgnoreParser = require('./markbot-ignore-parser');
const exists = require('./file-exists');
const stripPath = require('./strip-path');

const getFileCodeLang = function (fullPath) {
  return fullPath.match(/\.(html|css|js)$/)[1];
};

const findCompatibleFiles = function (folderpath, ignore, ext) {
  const fullPath = path.resolve(folderpath);
  const minFileExts = new RegExp(`min\.(${ext})$`);
  const ignoreRegExps = ignore.map((item) => new RegExp(item));
  const totalIgnores = ignoreRegExps.length;
  let files = glob.sync(`${fullPath}/**/*.${ext}`);

  if (!files) return [];

  files = files.filter((file) => {
    let strippedFile = stripPath(file, folderpath);

    if (file.match(minFileExts)) return false;

    for (let i = 0; i < totalIgnores; i++) {
      if (ignoreRegExps[i].test(strippedFile)) return false;
    }

    return true;
  });

  return files;
};

const mergeInheritedFile = function (markbotFile) {
  let inheritPath = path.resolve(`${__dirname}/../templates/${markbotFile.inherit}.yml`);

  if (exists.check(inheritPath)) {
    newMarkbotFile = yaml.safeLoad(fs.readFileSync(inheritPath, 'utf8'));
  } else {
    newMarkbotFile.inheritFileNotFound = true;
  }

  return merge(newMarkbotFile, markbotFile);
};

const bindFunctionalityToHtmlFiles = function (markbotFile) {
  if (markbotFile.allFiles && markbotFile.allFiles.functionality && markbotFile.html) {
    if (!markbotFile.functionality) markbotFile.functionality = [];

    markbotFile.html.forEach((file) => {
      markbotFile.functionality.push(merge({ path: file.path }, markbotFile.allFiles.functionality));
    });
  }

  return markbotFile;
};

const mergeAllFilesProperties = function (markbotFile, key) {
  if (!markbotFile[key]) return markbotFile;

  markbotFile[key].forEach((item, i) => {
    if (!markbotFile.allFiles[key]) return;

    markbotFile[key][i] = merge(Object.assign({}, markbotFile.allFiles[key]), item);
  });

  return markbotFile;
};

const bindAllFilesProperties = function (folderpath, ignoreFiles, markbotFile, next) {
  const keys = ['html', 'css', 'js', 'functionality', 'files', 'performance'];

  keys.forEach((key) => {
    if (!markbotFile[key] && !markbotFile.allFiles[key]) return;

    if (markbotFile.allFiles[key] && !markbotFile[key]) {
      let files = findCompatibleFiles(folderpath, ignoreFiles, key);

      if (!files) next(markbotFile);

      files.forEach((file) => {
        if (!markbotFile[key]) markbotFile[key] = [];

        markbotFile[key].push({ path: stripPath(file, folderpath), });
      });
    }

    markbotFile = mergeAllFilesProperties(markbotFile, key);
  });

  next(markbotFile);
};

const populateDefaults = function (folderpath, ignoreFiles, markbotFile, next) {
  if (!markbotFile.allFiles && !markbotFile.inherit) return next(markbotFile);
  if (markbotFile.inherit) markbotFile = mergeInheritedFile(markbotFile);

  if (markbotFile.allFiles) {
    bindAllFilesProperties(folderpath, ignoreFiles, markbotFile, (mf) => {
      next(bindFunctionalityToHtmlFiles(mf));
    });
  } else {
    next(markbotFile);
  }
}

const getMarkbotFile = function (markbotFilePath, next) {
  let markbotFile = yaml.safeLoad(fs.readFileSync(markbotFilePath, 'utf8'));
  let folderpath = path.parse(markbotFilePath).dir;

  markbotIgnoreParser.parse(folderpath, (ignoreFiles) => {
    populateDefaults(folderpath, ignoreFiles, markbotFile, next);
  });
};

const buildFromFolder = function (folderpath, next) {
  let markbotFile = yaml.safeLoad(fs.readFileSync(path.resolve(__dirname + '/../templates/basic-dropped-folder.yml'), 'utf8'));

  markbotIgnoreParser.parse(folderpath, (ignoreFiles) => {
    populateDefaults(folderpath, ignoreFiles, markbotFile, next);
  });
};

module.exports = {
  get: getMarkbotFile,
  buildFromFolder: buildFromFolder
};
