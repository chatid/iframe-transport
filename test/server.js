var fs = require('fs');
var http = require('http');
var connect = require('connect');
var parseurl = require('parseurl');
var url = require('url');

var middleware = connect();

var parentPort = parseInt(process.env.PORT || 8000);
var childPort = parseInt(process.env.CHILD_PORT || 8080);

var testJS = fs.readFileSync('test.js').toString();
var childHTML = fs.readFileSync('test/child.html').toString();

middleware.use(function(req, res, next) {
  var originalUrl = url.parse(req.originalUrl || req.url);
  var path = parseurl(req).pathname;
  if (path === '/test.js') {
    res.writeHead(200, {'Content-Type': 'application/javascript'});
    res.write(testJS.replace('http://localhost:8080', 'http://localhost:' + childPort));
    res.end();
  } else if (path === '/test/child.html') {
    parentPort = url.parse(req.headers.referer).port || parentPort;
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(childHTML.replace('http://localhost:8000', 'http://localhost:' + parentPort));
    res.end();
  } else {
    next();
  }
});
middleware.use(connect.static('.'));

var parentServer = http.createServer(middleware).listen(parentPort);
console.log("Parent server listening on " + parentPort);

var childServer = http.createServer(middleware).listen(childPort);
console.log("Child server listening on " + childPort);
