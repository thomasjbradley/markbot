module.exports = function (str) {
  return str.replace(/[^a-z0-9\-]/ig, '-').replace(/\-+/g, '-').toLowerCase();
};
