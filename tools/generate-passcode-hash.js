const
  fs = require('fs'),
  path = require('path'),
  crypto = require('crypto'),
  passcode = require('../lib/passcode'),
  config = require('../config.json')
  ;

config.secret = crypto.randomBytes(32).toString('hex');
config.passcodeHash = passcode.hash(process.env.MARKBOT_LOCK_PASSCODE, config.secret);
fs.writeFileSync(path.resolve(__dirname, '../config.json'), JSON.stringify(config, null, 2), 'utf8');
