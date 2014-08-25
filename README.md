iframe-transport
----------------

[![Testling Badge](https://ci.testling.com/chatid/iframe-transport.png)
](https://ci.testling.com/chatid/iframe-transport)

Wrapper around `postMessage` providing method invocation, callbacks, and event triggering.

### Clients

**LocalStorage Client**

Persist data across domains.

### Example

Start two servers, one on port `8000` and one on port `4000`:

```
$ http-server -p 8000
$ http-server -p 4000
```

Open `http://127.0.0.1:8000/example/local.html`

### Vendor libs

IFT and LSClient have no required dependencies. For compatibility and implementation
support, the following libraries are included with the project:

* https://github.com/carhartl/jquery-cookie (fork)
* https://github.com/ded/domready
* https://github.com/chatid/localstorage-events

### TODO

* Add tests
* IFT#destroy
