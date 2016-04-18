const map = require("IFTmap");

import Dexie from 'dexie';
import 'dexie-observable';

Dexie.Promise.on('error', (err) => {
  console.log('dexieErr:', err);
});

let db = new Dexie('chatid');
db.version(1).stores({
  state: '_id, data'
});

db.open();

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
  db.on('changes', function (changes) {
    changes.forEach(function (change) {
      switch (change.type) {
        case 1: // CREATED
        case 2: // UPDATED
          if (wasme) {
            wasme = false;
          } else {
            let data = change.obj.data;
            tell_parent({action: "broadcast", data}, event);
          }
          break;
        case 3: // DELETED
          tell_parent({action: "reset"}, event);
          break;
      }
    });
  });
}

function broadcast(data, event) {
  if (typeof data !== 'object') {
    return;
  }
  debouncedPut(data, event);
}

var debouncedPut = debounce((data, event) => {
  wasme = true;
  db.state.put({_id: filterOrigin(event.origin), data}).catch((err) => {
    if (err) {
      return console.log(err, data);
    }
  });
}, 300);

var debouncedRemove = debounce((event) => {
  db.delete().then(() => {
      console.log("Database successfully deleted");
  }).catch((err) => {
      console.log("Could not delete database");
  });
}, 0);

function get(event) {
  registerChanges(event);
  db.state.where('_id').equals(filterOrigin(event.origin)).toArray((docs) => {
    tell_parent({action: "get", data: {doc: docs[0].data, err: null}}, event);
  }).catch((err) => {
    tell_parent({action: "get", data: {doc: null, err: err}}, event);
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
