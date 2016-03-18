'use strict';

const
  path = require('path'),
  fs = require('fs')
  ;

let
  pkg = require('../package.json'),
  bldr = require('../builder.json')
  ;

const updateVersionBySearch = function (key, search) {
  pkg.scripts[key] = pkg.scripts[key].replace(new RegExp(`--${search}=[0-9]*.[0-9]*.[0-9]*`, 'g'), `--${search}=${pkg.version}`);
};

const updateVersion = function (key) {
  updateVersionBySearch(key, 'app-version');
  updateVersionBySearch(key, 'build-version');
};

bldr.win.version = pkg.version;

updateVersion('pack-osx');
updateVersion('pack-win');

fs.writeFileSync(path.resolve(__dirname, '../package.json'), JSON.stringify(pkg, null, 2), 'utf8');
fs.writeFileSync(path.resolve(__dirname, '../builder.json'), JSON.stringify(bldr, null, 2), 'utf8');
