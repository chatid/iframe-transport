const map = require("IFTmap");

import localforage from 'localforage';
import TabEmitter from '../lib/tab-emitter';
let emitter = TabEmitter();

localforage.ready(() => {
  tell_parent({action: "loaded"});
});

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

  emitter.on('changes', (change) => {
    if (wasme) {
      console.log("wasme");
      wasme = false;
    } else {
      console.log("change");
      switch (change.type) {
        case 'update':
          tell_parent({action: "broadcast", data: change.data}, event);
        break;
        case 'delete':
          localforage.clear((err) => {
            console.log('Database is now empty.', err);
            tell_parent({action: "reset"}, event);
          });
        break;
      }
    }
  });
}

function broadcast(data, event) {
  if (typeof data !== 'object') {
    return;
  }
  localforage.setItem(filterOrigin(event.origin), data, (err, doc) => {
    console.log("setItem");
    debouncedPut(data, event, err);
  });
}

var debouncedPut = debounce((data, event, err) => {
  console.log("debounce");
  wasme = true;
  if (err) {
    return;
  }
  emitter.emit('changes', {type: 'update', data});
}, 600);

// var debouncedRemove = debounce((event) => {
//   localforage.clear((err) => {
//     console.log('Database is now empty.');
//     emitter.emit('changes', { type: 'delete' });
//   });
// }, 0);

function handleReset() {
  wasme = false;
  once = false;
  emitter.emit('changes', { type: 'delete' });
}

function get(event) {
  registerChanges(event);
  localforage.getItem(filterOrigin(event.origin), function(err, doc) {
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
        handleReset();
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
