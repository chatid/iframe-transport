var getChildOptions = function() {
  if (location.origin.match(/github/)) { return "chatid.github.io" } else { return "127.0.0.1:8000" }
}

var getUrlPath = function(path) {
  var firstLocationPath = location.pathname.split("/")[0];
  var pathArr = path.split("/");
  if (pathArr[0] !== firstLocationPath)
    return "/" + firstLocationPath + path;
  return path;
}
