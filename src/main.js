const map = require("IFTmap");

import localforage from 'localforage';
// import crosstab from 'crosstab';
import TabEmitter from 'tab-emitter';
let emitter = TabEmitter();

// https://gist.github.com/jed/982883
function b(a) {      // a is a placeholder
  return a           // if the placeholder was passed, return
    ? (              // a random number from 0 to 15
      a ^            // unless b is 8,
      Math.random()  // in which case
      * 16           // a random number from
      >> a / 4       // 8 to 11
      ).toString(16) // in hexadecimal
    : (              // or otherwise a concatenated string:
      [1e7] +        // 10000000 +
      -1e3 +         // -1000 +
      -4e3 +         // -4000 +
      -8e3 +         // -80000000 +
      -1e11          // -100000000000,
      ).replace(     // replacing
        /[018]/g,    // zeroes, ones, and eights with
        b            // random hex digits
      );
}

const tabId = b();
let pollingStrategy = false;
let isWriting = false;
let originalOrigin;

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

let once = false;
function registerChanges(event) {
  if (once) return;
  once = true;
  originalOrigin = filterOrigin(event.origin);

  emitter.on('changes', (change) => {
    if (change.data.tabId !== tabId) {
      switch (change.type) {
        case 'update':
          if (originalOrigin === filterOrigin(change.data.origin))
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
  isWriting = true;
  data.tabId = tabId;
  data.lastInteraction = Date.now();
  data.origin = event.origin;
  localforage.setItem(filterOrigin(event.origin), data, (err, doc) => {
    debouncedPut(data, event, err);
  });
}

var debouncedPut = debounce((data, event, err) => {
  isWriting = false;
  if (err) {
    return;
  }
  if (!pollingStrategy) {
    emitter.emit('changes', {type: 'update', data});
  }
}, 100);

function handleReset() {
  once = false;
  emitter.emit('changes', { type: 'delete' });
}

function get(event) {
  registerChanges(event);
  localforage.getItem(filterOrigin(event.origin), function(err, doc) {
    tell_parent({action: "get", data: {doc: doc, err: err}}, event);
  });
}

function poll(event) {
  if (!isWriting) {
    localforage.getItem(filterOrigin(event.origin), function(err, doc) {
      if (doc && doc.tabId && doc.tabId !== tabId) {
        tell_parent({action: "poll", data: {doc: doc, err: err}}, event);
      }
    });
  }
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
      case "poll":
        pollingStrategy = true;
        poll(event);
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
