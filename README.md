iframe-transport
----------------

Bi-directional RPC over iframe. Targets modern browsers, IE8+.

```javascript
ift.connect({
  name: 'my_ift',
  childOrigin: 'http://childapp.com',
  childPath: '/child.html'
}).ready(function(courier) {
  var channel = courier.channel('test');
  channel.request('test', ['hello', 'child!'], function(response) {
    console.log(response); // hello parent!
  });
});
```

```javascript
var channel = ift.connect({
  trustedOrigins: ['http://parentapp.com']
}).channel('test');
channel.on('request', function(id, method, params) {
  console.log(params[0], params[1]); // hello child!
  channel.respond(id, 'hello parent!');
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

* Break into modules and setup build pipeline
