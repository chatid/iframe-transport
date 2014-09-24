var _ = require('underscore');

var parseQuery = exports.parseQuery = function(qs){
  return _.reduce(qs.replace('?', '').split('&'), function(obj, pair) {
    var i = pair.indexOf('=')
      , key = pair.slice(0, i)
      , val = pair.slice(++i);

    obj[key] = decodeURIComponent(val);
    return obj;
  }, {});
};

var buildQuery = exports.buildQuery = function(url, obj) {
  var result = url || '';
  if (result.indexOf('?') > -1) result += '&';
  else result += '?';
  var pairs = [];
  for (key in obj) pairs.push(key + '=' + obj[key]);
  result += pairs.join('&');
  return result;
}
