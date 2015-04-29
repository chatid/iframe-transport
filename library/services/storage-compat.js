/*
 * IFrameTransport - Storage Service Extension
 *
 * Use a cookie to capture which key changed for IE8
 * Use a cookie to ignore "storage" events that I triggered
*/

var LSEvents = require('localstorage-events'),
    storage = require('./storage'),
    ift = require('../ift'),
    support = require('../util/support'),
    mixin = require('../util/mixin');

mixin(support, {
  myWritesTrigger: ('onstoragecommit' in document)
});

// Decorate the Storage service if necessary.
if (support.myWritesTrigger) {
  ift.registerService('storage', LSEvents(ift.service('storage')));
}

module.exports = ift;
