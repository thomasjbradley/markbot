module.exports = function (file, fullPath) {
  return file.replace(fullPath, '').replace(/^[\/\\]/, '');
};
