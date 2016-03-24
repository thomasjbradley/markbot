'use strict';

var
  path = require('path'),
  https = require('https')
;

module.exports.check = function (listener, filePath, group, repo, username) {
  let
    id = 'live-website',
    label = 'Accessible',
    errors = [`The website “https://${username}.github.io/${repo}/” is not available—double check that all the commits have been synced`],
    opts = {
      method: 'HEAD',
      host: `${username}.github.io`,
      path: `/${repo}/`
    }
    ;

  listener.send('check-group:item-new', group, id, label);
  listener.send('check-group:item-computing', group, id, label);

  https.get(opts, function (res) {
    if(res.statusCode >= 200 && res.statusCode <= 299) {
      listener.send('check-group:item-complete', group, id, label);
    } else {
      listener.send('check-group:item-complete', group, id, label, errors);
    }
  }).on('error', function (e) {
    listener.send('check-group:item-complete', group, id, label, errors);
  });
};
