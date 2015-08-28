var getChildOptions = function() {
  if (location.origin.match(/github/)) { return "chatid.github.io" } else { return "127.0.0.1:8000" }
}
