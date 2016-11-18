'use strict';

const path = require('path');
const https = require('https');
const markbotMain = require('../markbot-main');

module.exports.check = function (filePath, group, repo, username) {
  let
    id = 'live-website',
    label = 'Online',
    errors = [`The website @@https://${username.toLowerCase()}.github.io/${repo}/@@ is not online. Double check that all the commits have been synced & that the \`index.html\` file, on GitHub’s website, follows the naming conventions`],
    opts = {
      method: 'HEAD',
      host: `${username.toLowerCase()}.github.io`,
      path: `/${repo}/`
    }
    ;

  markbotMain.send('check-group:item-new', group, id, label);
  markbotMain.send('check-group:item-computing', group, id, label);

  https.get(opts, function (res) {
    if(res.statusCode >= 200 && res.statusCode <= 299) {
      markbotMain.send('check-group:item-complete', group, id, label);
    } else {
      markbotMain.send('check-group:item-complete', group, id, label, errors);
    }
  }).on('error', function (e) {
    markbotMain.send('check-group:item-complete', group, id, label, errors);
  });
};
