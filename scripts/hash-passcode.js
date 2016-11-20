'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const passcode = require('../app/passcode');

let config = require('../config.json');

config.secret = crypto.randomBytes(32).toString('hex');
config.passcodeHash = passcode.hash(process.env.MARKBOT_LOCK_PASSCODE, config.secret);
fs.writeFileSync(path.resolve(__dirname, '../config.json'), JSON.stringify(config, null, 2), 'utf8');
