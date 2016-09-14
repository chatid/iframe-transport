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
exec('aws s3 cp --acl public-read --content-type text/html build/iframe.html s3://iframe-stage.chatid.com/');
exec('aws s3 cp --acl public-read --content-type application/javascript --content-encoding gzip build/main.js s3://iframe-stage.chatid.com/');
