(function () {
  'use strict';

  const https = require('https');
  const main = require('electron').remote;
  const markbotMain = main.require('./app/markbot-main');

  const group = taskDetails.group;
  const repo = taskDetails.options.repo;
  const username = taskDetails.options.username;
  const id = 'live-website';
  const label = 'Online';
  const errors = [`The website @@https://${username.toLowerCase()}.github.io/${repo}/@@ is not online. Double check that all the commits have been synced & that the \`index.html\` file, on GitHub’s website, follows the naming conventions`];
  const opts = {
    method: 'HEAD',
    host: `${username.toLowerCase()}.github.io`,
    path: `/${repo}/`,
  };

  markbotMain.send('check-group:item-new', group, id, label);
  markbotMain.send('check-group:item-computing', group, id, label);

  https.get(opts, function (res) {
    if(res.statusCode >= 200 && res.statusCode <= 299) {
      markbotMain.send('check-group:item-complete', group, id, label);
    } else {
      markbotMain.send('check-group:item-complete', group, id, label, errors);
    }

    done();
  }).on('error', function (e) {
    markbotMain.send('check-group:item-complete', group, id, label, errors);
    done();
  });
}());
