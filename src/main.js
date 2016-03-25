import map from './map';

const PouchDB = require('pouchdb');
require('pouchdb/extras/localstorage');

const db = new PouchDB('chatid', {adapter: 'localstorage'});

function filterOrigin(x) {
  let a = document.createElement('a');
  a.href = x;
  x = a.host;
  if (map.hasOwnProperty(x)) {
    return map[x];
  }
  return x;
}

// Shim for IE
if (!window.addEventListener) {
  window.addEventListener = function(name, cb) {
    window.attachEvent("on" + name, function() {
      return cb(window.event);
    })
  };
}

function debounce(func, wait) {
  let timeout;
  return function() {
    let context = this, args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(function() {
       timeout = null;
       func.apply(context, args);
    }, wait);
  };
};

let wasme = false;
let once = false;
function registerChanges(event) {
  if (once) return;
  once = true;
  db.changes({
    since: 'now',
    live: true,
    include_docs: true,
    doc_ids: [filterOrigin(event.origin)]
  }).on('change', function(info) {
    if (wasme) {
      wasme = false;
    } else if (info.hasOwnProperty('deleted') && info.deleted === true) {
      tell_parent({action: "reset"}, event);
    } else {
      tell_parent({action: "broadcast", data: info.doc}, event);
    }
  }).on('error', function(error) {
    console.log(error);
  });
}

function broadcast(data, event) {
  if (typeof data !== 'object') {
    return;
  }
  debouncedPut(data, event);
}

var debouncedPut = debounce((data, event) => {
  db.get(filterOrigin(event.origin), (err, doc) => {
    wasme = true;
    if (err) {
      if (err.status === 404) { //save first doc
        return db.put(data, filterOrigin(event.origin), (err, response) => {
          if (err) { return console.log(err); }
        });
      }
      return console.log(err);
    }
    db.put(data, filterOrigin(event.origin), doc._rev, (err, response) => {
      if (err) {
        return console.log(err, doc, data);
      }
    });
  });
}, 300);

var debouncedRemove = debounce((event) => {
  db.get(filterOrigin(event.origin), (err, doc) => {
    doc && db.remove(doc, () => {
      db.destroy();
    });
  });
}, 0);

function get(event) {
  registerChanges(event);
  db.get(filterOrigin(event.origin), function(err, doc) {
    tell_parent({action: "get", data: {doc: doc, err: err}}, event);
  });
}

function on_message(event) {
  var data = event.data;
  try {
    switch(data.action) {
      case "get":
        get(event);
      break;
      case "reset":
        debouncedRemove(event);
      break;
      case "broadcast":
        broadcast(data.data, event);
      break;
    }
  } catch (e) {
    tell_parent({action: "error", error: e, req: data}, event);
  }
}

function tell_parent(data, event) {
  if (event && event.hasOwnProperty('origin')) {
    window.parent.postMessage(data, event.origin);
  } else {
    window.parent.postMessage(data, '*');
  }
}

window.addEventListener("message", function(event) {
  on_message(event);
}, false);

// We might as well use onload for compatability
// Normally you don't want to, as it waits for images to load - but we don't have any on this page!
// DOMContentLoaded doesn't work in IE<9
window.onload = function() {
  tell_parent({action: "loaded"});
};
