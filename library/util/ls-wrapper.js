module.exports = {
  get: function(key) {
    return localStorage.getItem(key);
  },
  set: function(key, value, options) {
    return localStorage.setItem(key, value);
  },
  unset: function(keys) {
    if (!(keys instanceof Array)) keys = [keys];
    for (var i = 0; i < keys.length; i++) localStorage.removeItem(keys[i]);
  }
};
