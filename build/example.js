(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["iframe-transport"] = factory();
	else
		root["iframe-transport"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _IFT = __webpack_require__(1);

	var _IFT2 = _interopRequireDefault(_IFT);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	var iftInstance = new _IFT2.default('http://localhost:8081');

	var state = { currentCount: 0 };

	var currentCountEl = document.querySelector('.currentCount');
	var button = document.getElementById('incr');

	button.addEventListener('click', function () {
	  state.currentCount++;
	  localSync();
	  iftInstance.broadcast(state);
	}, false);

	iftInstance.on('get', function (data) {
	  if (data.doc && data.doc.currentCount) {
	    state.currentCount = data.doc.currentCount;
	    localSync();
	  }
	});

	iftInstance.on('broadcast', function (data) {
	  if (data && data.currentCount) {
	    state.currentCount = data.currentCount;
	    localSync();
	  }
	});

	iftInstance.on('loaded', function () {
	  iftInstance.get();
	});

	function localSync() {
	  currentCountEl.innerHTML = state.currentCount;
	}

	localSync();

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(module) {'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	(function webpackUniversalModuleDefinition(root, factory) {
		if (( false ? 'undefined' : _typeof(exports)) === 'object' && ( false ? 'undefined' : _typeof(module)) === 'object') module.exports = factory();else if (true) !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') exports["iframe-transport"] = factory();else root["iframe-transport"] = factory();
	})(undefined, function () {
		return (/******/function (modules) {
				// webpackBootstrap
				/******/ // The module cache
				/******/var installedModules = {};

				/******/ // The require function
				/******/function __webpack_require__(moduleId) {

					/******/ // Check if module is in cache
					/******/if (installedModules[moduleId])
						/******/return installedModules[moduleId].exports;

					/******/ // Create a new module (and put it into the cache)
					/******/var module = installedModules[moduleId] = {
						/******/exports: {},
						/******/id: moduleId,
						/******/loaded: false
						/******/ };

					/******/ // Execute the module function
					/******/modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

					/******/ // Flag the module as loaded
					/******/module.loaded = true;

					/******/ // Return the exports of the module
					/******/return module.exports;
					/******/
				}

				/******/ // expose the modules object (__webpack_modules__)
				/******/__webpack_require__.m = modules;

				/******/ // expose the module cache
				/******/__webpack_require__.c = installedModules;

				/******/ // __webpack_public_path__
				/******/__webpack_require__.p = "/";

				/******/ // Load entry module and return exports
				/******/return __webpack_require__(0);
				/******/
			}(
			/************************************************************************/
			/******/[
			/* 0 */
			/***/function (module, exports, __webpack_require__) {

				'use strict';

				Object.defineProperty(exports, "__esModule", {
					value: true
				});

				function _classCallCheck(instance, Constructor) {
					if (!(instance instanceof Constructor)) {
						throw new TypeError("Cannot call a class as a function");
					}
				}

				// [I][F]rame [T]ranspot

				var IFRAME_SRC = true ? '/build/iframe.html' : '/iframe.html';

				var IFT = function IFT() {
					var _this = this;

					var chatid_domain = arguments.length <= 0 || arguments[0] === undefined ? 'https://iframe.chatid.com' : arguments[0];

					_classCallCheck(this, IFT);

					this.create_iframe = function () {
						_this.iframe_loaded = false;
						_this.iframe = document.createElement("iframe");
						_this.iframe.src = _this.iframe_domain + IFRAME_SRC;
						_this.iframe.sandbox = 'allow-scripts allow-same-origin';
						// this.iframe.frameborder = 0; // HTML 4 only
						_this.iframe.height = 0;
						_this.iframe.width = 0;
						document.body.appendChild(_this.iframe);
					};

					this.on = function (e, cb) {
						_this.cbs[e] = cb;
					};

					this.start_listening = function () {
						var that = _this;
						var cb = function cb(event) {
							var data = event.data;
							if (data.action == "loaded") {
								// can be from any origin
								that.iframe_loaded = true;
								// that.retry_queued();
							} else if (event.origin !== that.iframe_domain) {
									return;
								}
							// Call handler
							if (data.action in _this.cbs) {
								_this.cbs[data.action](data.data);
							}
						};

						if (window.addEventListener) {
							window.addEventListener("message", cb, false);
						} else {
							window.attachEvent("onmessage", function () {
								return cb(window.event);
							});
						}
					};

					this.iframe_send = function (data) {
						if (!_this.iframe_loaded) throw "not ready";
						_this.iframe.contentWindow.postMessage(data, _this.iframe_domain);
					};

					this.get = function () {
						return _this.iframe_send({ action: "get" });
					};

					this.broadcast = function (data) {
						return _this.iframe_send({ action: "broadcast", data: data });
					};

					this.poll = function () {
						setInterval(function () {
							return _this.iframe_send({ action: "poll" });
						}, 300);
					};

					this.reset = function () {
						return _this.iframe_send({ action: "reset" });
					};

					this.iframe_domain = chatid_domain; // No trailing slash
					this.create_iframe();
					this.start_listening();
					this.cbs = {};
				}

				// API

				;

				exports.default = IFT;
				;

				/***/
			}
			/******/])
		);
	});
	;
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2)(module)))

/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = function(module) {
		if(!module.webpackPolyfill) {
			module.deprecate = function() {};
			module.paths = [];
			// module.parent = undefined by default
			module.children = [];
			module.webpackPolyfill = 1;
		}
		return module;
	}


/***/ }
/******/ ])
});
;