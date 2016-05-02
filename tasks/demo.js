/* eslint-disable no-console, max-len */
'use strict';

const shell = require('shelljs');
const exec = shell.exec;
const clc = require('cli-color');

console.log(clc.blue('build stuff ...'));
exec('npm run build_prod');

console.log(clc.blue('gzip stuff ...'));
exec('gzip build/main.js');
exec('mv build/main.js.gz build/main.js');

console.log(clc.blue('s3cmd put stuff ...'));
const headers = "--add-header='Content-Type':'application/javascript' --add-header='Content-Encoding':'gzip'";

exec('s3cmd put -P build/iframe.html s3://stage-iframe.chatid.com/');
exec(`s3cmd put -P ${headers} build/main.js s3://stage-iframe.chatid.com/`);
