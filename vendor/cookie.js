/*!
 * Adapted from jQuery Cookie Plugin v1.3.1
 * https://github.com/carhartl/jquery-cookie
 *
 * Copyright 2013 Klaus Hartl
 * Released under the MIT license
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) define('cookie', factory);
  else root.Cookie = factory();
}(this, function() {

    var Cookie = {},
        config = {},
        pluses = /\+/g;

    function raw(s) {
        return s;
    }

    function decoded(s) {
        try {
            // Throws error with "0%guest%0,0" which was found on www.lordandtaylor.com
            return decodeURIComponent(s.replace(pluses, ' '));
        } catch(e) {
            return s;
        }
    }

    function converted(s) {
        if (s.indexOf('"') === 0) {
            // This is a quoted cookie as according to RFC2068, unescape
            s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        }
        try {
            return config.json ? JSON.parse(s) : s;
        } catch(er) {}
    }

    Cookie.set = function (key, value, options) {

        options = options || {};

        if (typeof options.expires === 'number') {
            var days = options.expires, t = options.expires = new Date();
            t.setDate(t.getDate() + days);
        }

        value = config.json ? JSON.stringify(value) : String(value);

        return (document.cookie = [
            config.raw ? key : encodeURIComponent(key),
            '=',
            config.raw ? value : encodeURIComponent(value),
            options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
            options.path    ? '; path=' + options.path : '',
            options.domain  ? '; domain=' + options.domain : '',
            options.secure  ? '; secure' : ''
        ].join(''));

    };

    Cookie.get = function(key, options) {
        // read
        var decode = config.raw ? raw : decoded;
        var cookies = document.cookie.split('; ');
        var result = key ? undefined : {};
        for (var i = 0, l = cookies.length; i < l; i++) {
            var parts = cookies[i].split('=');
            var name = decode(parts.shift());
            var cookie = decode(parts.join('='));

            if (key && key === name) {
                result = converted(cookie);
                break;
            }

            if (!key) {
                result[name] = converted(cookie);
            }
        }

        return result;
    };

    Cookie.unset = function (key, options) {
        if (Cookie.get(key) !== undefined) {
            options = options || {};
            options.expires = -1;
            Cookie.set(key, '', options);
            return true;
        }
        return false;
    };

    return Cookie;

}));
