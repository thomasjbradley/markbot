'use strict';

/**
 * This function is mainly to work around Windows issues
 * The CSS validator doesn’t accept Windows paths because of back slashes
 *   the path needs to be a valid URL
 */
module.exports = function (path) {
  let urlPath = path.replace(/\\/g, '/');

  if (urlPath[0] !== '/') urlPath = '/' + urlPath;

  return urlPath;
};
