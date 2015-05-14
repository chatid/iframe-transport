iframe-transport
----------------

Bi-directional RPC over iframe. Targets modern browsers, IE8+.

```javascript
ift.parent({
  childOrigin: 'http://childapp.com',
  childPath: '/child.html'
}).ready(function(manager) {
  var channel = manager.channel('test');
  channel.request('hello', ['child!'], function(response) {
    console.log(response); // hello parent!
  });
});
```

```javascript
ift.child({
  trustedOrigins: ['http://parentapp.com']
}).ready(function(manager) {
  var channel = manager.channel('test');
  channel.on('request', function(id, method, params) {
    console.log(method, params[0]); // hello child!
    channel.respond(id, 'hello parent!');
  });
});
```

### Services

**LocalStorage Service**

Persist data across domains.

### Example

Start two servers, one on port `8000` and one on port `4000`:

```
$ http-server -p 8000
$ http-server -p 4000
```

Open `http://127.0.0.1:8000/example/parent.html`

### Vendor libs

IFT and StorageService have no required dependencies. For compatibility and implementation
support, the following libraries are included with the project:

* https://github.com/carhartl/jquery-cookie (fork)
* https://github.com/ded/domready
* https://github.com/chatid/localstorage-events

# TODO

* Critical bug: consumers/services don't coordinate readiness
* Break into modules and setup build pipeline
