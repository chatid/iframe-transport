/* eslint-disable no-console, max-len */
'use strict';
const execSync = require('child_process').execSync;
const commitHash = execSync('git rev-parse --short HEAD').toString().replace('\n', '').slice(-7);

const shell = require('shelljs');
const exec = shell.exec;
const clc = require('cli-color');

console.log(clc.blue('build stuff ...'));
exec('npm run build_prod');

// console.log(clc.blue('gzip stuff ...'));
// exec('gzip build/main.js');
// exec('mv build/main.js.gz build/main.js');

console.log(clc.blue('s3cmd put stuff ...'));
const headers = "--mime-type='application/javascript'"; //--add-header='Content-Encoding':'gzip'";

exec(`s3cmd put -P build/iframe.html s3://iframe-stage.chatid.com/${commitHash}/`);
exec(`s3cmd put -P ${headers} build/main.js s3://iframe-stage.chatid.com/${commitHash}/`);
