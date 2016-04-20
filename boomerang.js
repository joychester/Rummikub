/*
 * Copyright (c) 2011, Yahoo! Inc.  All rights reserved.
 * Copyright (c) 2012, Log-Normal, Inc.  All rights reserved.
 * Copyright (c) 2014, SOASTA, Inc. All rights reserved.
 * Copyrights licensed under the BSD License. See the accompanying LICENSE.txt file for terms.
 */

/**
\file boomerang.js
boomerang measures various performance characteristics of your user's browsing
experience and beacons it back to your server.

\details
To use this you'll need a web site, lots of users and the ability to do
something with the data you collect.  How you collect the data is up to
you, but we have a few ideas.
*/

// Measure the time the script started
// This has to be global so that we don't wait for the entire
// BOOMR function to download and execute before measuring the
// time.  We also declare it without `var` so that we can later
// `delete` it.  This is the only way that works on Internet Explorer
BOOMR_start = Date.now();

/**
 Check the value of document.domain and fix it if incorrect.
 This function is run at the top of boomerang, and then whenever
 init() is called.  If boomerang is running within an iframe, this
 function checks to see if it can access elements in the parent
 iframe.  If not, it will fudge around with document.domain until
 it finds a value that works.

 This allows customers to change the value of document.domain at
 any point within their page's load process, and we will adapt to
 it.
 */
function BOOMR_check_doc_domain(domain) {
	//BOOMR.debug("BOOMR_check_doc_domain_#38");
	/*eslint no-unused-vars:0*/
	var test;

	// If domain is not passed in, then this is a global call
	// domain is only passed in if we call ourselves, so we
	// skip the frame check at that point
	if (!domain) {
		// If we're running in the main window, then we don't need this
		if (window.parent === window || !document.getElementById("boomr-if-as")) {
			return;// true;	// nothing to do
		}

		if (window.BOOMR && BOOMR.boomerang_frame && BOOMR.window) {
			try {
				// If document.domain is changed during page load (from www.blah.com to blah.com, for example),
				// BOOMR.window.location.href throws "Permission Denied" in IE.
				// Resetting the inner domain to match the outer makes location accessible once again
				if (BOOMR.boomerang_frame.document.domain !== BOOMR.window.document.domain) {
					BOOMR.boomerang_frame.document.domain = BOOMR.window.document.domain;
				}
			}
			catch(err) {
				if (!BOOMR.isCrossOriginError(err)) {
					BOOMR.addError(err, "BOOMR_check_doc_domain.domainFix");
				}
			}
		}
		domain = document.domain;
	}

	if (domain.indexOf(".") === -1) {
		return;// false;	// not okay, but we did our best
	}

	// 1. Test without setting document.domain
	try {
		test = window.parent.document;
		return;// test !== undefined;	// all okay
	}
	// 2. Test with document.domain
	catch (err) {
		document.domain = domain;
	}
	try {
		test = window.parent.document;
		return;// test !== undefined;	// all okay
	}
	// 3. Strip off leading part and try again
	catch (err) {
		domain = domain.replace(/^[\w\-]+\./, "");
	}

	BOOMR_check_doc_domain(domain);
}

BOOMR_check_doc_domain();


// beaconing section
// the parameter is the window
(function(w) {
	var impl, boomr, d, myurl, createCustomEvent, dispatchEvent, visibilityState, visibilityChange, orig_w = w;

	// This is the only block where we use document without the w. qualifier
	if (w.parent !== w
			&& document.getElementById("boomr-if-as")
			&& document.getElementById("boomr-if-as").nodeName.toLowerCase() === "script") {
		w = w.parent;
		myurl = document.getElementById("boomr-if-as").src;
	}

	d = w.document;

	// Short namespace because I don't want to keep typing BOOMERANG
	if (!w.BOOMR) { w.BOOMR = {}; }
	BOOMR = w.BOOMR;
	// don't allow this code to be included twice
	if (BOOMR.version) {
		return;
	}

	BOOMR.version = "0.9";
	BOOMR.window = w;
	BOOMR.boomerang_frame = orig_w;

	if (!BOOMR.plugins) { BOOMR.plugins = {}; }

	// CustomEvent proxy for IE9 & 10 from https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent
	(function() {
		//BOOMR.debug("Function_Call_#129");
		try {
			if (new w.CustomEvent("CustomEvent") !== undefined) {
				createCustomEvent = function(e_name, params) {
					return new w.CustomEvent(e_name, params);
				};
			}
		}
		catch (ignore) {
			// empty
		}

		try {
			if (!createCustomEvent && d.createEvent && d.createEvent( "CustomEvent" )) {
				createCustomEvent = function(e_name, params) {
					var evt = d.createEvent( "CustomEvent" );
					params = params || { cancelable: false, bubbles: false };
					evt.initCustomEvent( e_name, params.bubbles, params.cancelable, params.detail );

					return evt;
				};
			}
		}
		catch (ignore) {
			// empty
		}

		if (!createCustomEvent && d.createEventObject) {
			createCustomEvent = function(e_name, params) {
				var evt = d.createEventObject();
				evt.type = evt.propertyName = e_name;
				evt.detail = params.detail;

				return evt;
			};
		}

		if (!createCustomEvent) {
			createCustomEvent = function() { return undefined; };
		}
	}());

	/**
	 dispatch a custom event to the browser
	 @param e_name	The custom event name that consumers can subscribe to
	 @param e_data	Any data passed to subscribers of the custom event via the `event.detail` property
	 @param async	By default, custom events are dispatched immediately.
			Set to true if the event should be dispatched once the browser has finished its current
			JavaScript execution.
	 */
	dispatchEvent = function(e_name, e_data, async) {
		BOOMR.debug("dispatchEvent_#180_" + e_name);
		var ev = createCustomEvent(e_name, {"detail": e_data});
		if (!ev) {
			return;
		}

		function dispatch() {
			if (d.dispatchEvent) {
				d.dispatchEvent(ev);
			}
			else if (d.fireEvent) {
				d.fireEvent("onpropertychange", ev);
			}
		}

		if (async) {
			BOOMR.setImmediate(dispatch);
		}
		else {
			dispatch();
		}
	};

	// visibilitychange is useful to detect if the page loaded through prerender
	// or if the page never became visible
	// http://www.w3.org/TR/2011/WD-page-visibility-20110602/
	// http://www.nczonline.net/blog/2011/08/09/introduction-to-the-page-visibility-api/
	// https://developer.mozilla.org/en-US/docs/Web/Guide/User_experience/Using_the_Page_Visibility_API

	// Set the name of the hidden property and the change event for visibility
	if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
		visibilityState = "visibilityState";
		visibilityChange = "visibilitychange";
	}
	else if (typeof document.mozHidden !== "undefined") {
		visibilityState = "mozVisibilityState";
		visibilityChange = "mozvisibilitychange";
	}
	else if (typeof document.msHidden !== "undefined") {
		visibilityState = "msVisibilityState";
		visibilityChange = "msvisibilitychange";
	}
	else if (typeof document.webkitHidden !== "undefined") {
		visibilityState = "webkitVisibilityState";
		visibilityChange = "webkitvisibilitychange";
	}


	// impl is a private object not reachable from outside the BOOMR object
	// users can set properties by passing in to the init() method
	impl = {
		// properties
		beacon_url: "",
		// beacon request method, either GET, POST or AUTO. AUTO will check the
		// request size then use GET if the request URL is less than 2000 chars
		// otherwise it will fall back to a POST request.
		beacon_type: "AUTO",
		// strip out everything except last two parts of hostname.
		// This doesn't work well for domains that end with a country tld,
		// but we allow the developer to override site_domain for that.
		// You can disable all cookies by setting site_domain to a falsy value
		site_domain: w.location.hostname.
					replace(/.*?([^.]+\.[^.]+)\.?$/, "$1").
					toLowerCase(),
		//! User's ip address determined on the server.  Used for the BA cookie
		user_ip: "",
		// Whether or not to send beacons on page load
		autorun: true,

		strip_query_string: false,

		onloadfired: false,

		handlers_attached: false,

		//adding custom properties with default value
		timeout: 15000,

		beacon_delay: 0,

		beacon_switch: "on",

		url_pattern: "ALL",

		blacklist: [],

		sample_ratio: 1,

		events: {
			"page_ready": [],
			"page_unload": [],
			"before_unload": [],
			"dom_loaded": [],
			"visibility_changed": [],
			"before_beacon": [],
			"onbeacon": [],
			"xhr_load": [],
			"click": [],
			"form_submit": []
		},

		public_events: {
			"before_beacon": "onBeforeBoomerangBeacon",
			"onbeacon": "onBoomerangBeacon",
			"onboomerangloaded": "onBoomerangLoaded"
		},

		vars: {},

		errors: {},

		disabled_plugins: {},

		xb_handler: function(type) {
			BOOMR.debug("xb_handler_#294_" + type);
			return function(ev) {
				var target;
				if (!ev) { ev = w.event; }
				if (ev.target) { target = ev.target; }
				else if (ev.srcElement) { target = ev.srcElement; }
				if (target.nodeType === 3) {// defeat Safari bug
					target = target.parentNode;
				}

				// don't capture events on flash objects
				// because of context slowdowns in PepperFlash
				if (target && target.nodeName.toUpperCase() === "OBJECT" && target.type === "application/x-shockwave-flash") {
					return;
				}
				impl.fireEvent(type, target);
			};
		},

		fireEvent: function(e_name, data) {
			BOOMR.debug("fireEvent_#314_" + e_name);
			var i, handler, handlers;

			e_name = e_name.toLowerCase();

			if (!this.events.hasOwnProperty(e_name)) {
				return;// false;
			}

			if (this.public_events.hasOwnProperty(e_name)) {
				dispatchEvent(this.public_events[e_name], data);
			}

			handlers = this.events[e_name];

			for (i=0; i<handlers.length; i++) {
				try {
					handler = handlers[i];
					handler.fn.call(handler.scope, data, handler.cb_data);
				}
				catch (err) {
					BOOMR.addError(err, "fireEvent." + e_name + "<" + i + ">");
				}
			}

			return;// true;
		}
	};


	// We create a boomr object and then copy all its properties to BOOMR so that
	// we don't overwrite anything additional that was added to BOOMR before this
	// was called... for example, a plugin.
	boomr = {
		t_lstart: null,
		t_start: BOOMR_start,
		t_end: null,
		//! t_pload: Value of the BOOMR_onload set in the host page
		t_onload: undefined,

		url: myurl,

		// Utility functions
		utils: {
			objectToString: function(o, separator, nest_level) {
				BOOMR.debug("objectToString_#359");
				var value = [], k;

				if (!o || typeof o !== "object") {
					return o;
				}
				if (separator === undefined) {
					separator="\n\t";
				}
				if (!nest_level) {
					nest_level=0;
				}

				if (Object.prototype.toString.call(o) === "[object Array]") {
					for (k=0; k<o.length; k++) {
						if (nest_level > 0 && o[k] !== null && typeof o[k] === "object") {
							value.push(
								this.objectToString(
									o[k],
									separator + (separator === "\n\t" ? "\t" : ""),
									nest_level-1
								)
							);
						}
						else {
							if (separator === "&") {
								value.push(encodeURIComponent(o[k]));
							}
							else {
								value.push(o[k]);
							}
						}
					}
					separator = ",";
				}
				else {
					for (k in o) {
						if (Object.prototype.hasOwnProperty.call(o, k)) {
							if (nest_level > 0 && o[k] !== null && typeof o[k] === "object") {
								value.push(encodeURIComponent(k) + "=" +
									this.objectToString(
										o[k],
										separator + (separator === "\n\t" ? "\t" : ""),
										nest_level-1
									)
								);
							}
							else {
								if (separator === "&") {
									value.push(encodeURIComponent(k) + "=" + encodeURIComponent(o[k]));
								}
								else {
									value.push(k + "=" + o[k]);
								}
							}
						}
					}
				}

				return value.join(separator);
			},

			getCookie: function(name) {
				BOOMR.debug("getCookie_#422");
				if (!name) {
					return null;
				}

				name = " " + name + "=";

				var i, cookies;
				cookies = " " + d.cookie + ";";
				if ( (i=cookies.indexOf(name)) >= 0 ) {
					i += name.length;
					cookies = cookies.substring(i, cookies.indexOf(";", i)).replace(/^"/, "").replace(/"$/, "");
					return cookies;
				}

				return null;
			},

			setCookie: function(name, subcookies, max_age) {
				BOOMR.debug("setCookie_#441");
				var value, nameval, savedval, c, exp;

				if (!name || !impl.site_domain) {
					BOOMR.debug("No cookie name or site domain: " + name + "/" + impl.site_domain);
					return false;
				}

				value = this.objectToString(subcookies, "&");
				nameval = name + "=\"" + value + "\"";

				c = [nameval, "path=/", "domain=" + impl.site_domain];
				if (max_age) {
					exp = new Date();
					exp.setTime(exp.getTime() + max_age*1000);
					exp = exp.toGMTString();
					c.push("expires=" + exp);
				}

				if ( nameval.length < 500 ) {
					d.cookie = c.join("; ");
					// confirm cookie was set (could be blocked by user's settings, etc.)
					savedval = this.getCookie(name);
					if (value === savedval) {
						return true;
					}
					BOOMR.warn("Saved cookie value doesn't match what we tried to set:\n" + value + "\n" + savedval);
				}
				else {
					BOOMR.warn("Cookie too long: " + nameval.length + " " + nameval);
				}

				return false;
			},

			getSubCookies: function(cookie) {
				BOOMR.debug("getSubCookies_#477");
				var cookies_a,
				    i, l, kv,
				    gotcookies=false,
				    cookies={};

				if (!cookie) {
					return null;
				}

				if (typeof cookie !== "string") {
					BOOMR.debug("TypeError: cookie is not a string: " + typeof cookie);
					return null;
				}

				cookies_a = cookie.split("&");

				for (i=0, l=cookies_a.length; i<l; i++) {
					kv = cookies_a[i].split("=");
					if (kv[0]) {
						kv.push("");	// just in case there's no value
						cookies[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1]);
						gotcookies=true;
					}
				}

				return gotcookies ? cookies : null;
			},

			removeCookie: function(name) {
				BOOMR.debug("removeCookie_#507");
				return this.setCookie(name, {}, -86400);
			},

			cleanupURL: function(url) {
				BOOMR.debug("cleanupURL_#512");
				if (!url || Object.prototype.toString.call(url) === "[object Array]") {
					return "";
				}
				if (impl.strip_query_string) {
					return url.replace(/\?.*/, "?qs-redacted");
				}
				return url;
			},

			hashQueryString: function(url, stripHash) {
				BOOMR.debug("hashQueryString_#523");
				if (!url) {
					return url;
				}
				if (!url.match) {
					BOOMR.addError("TypeError: Not a string", "hashQueryString", typeof url);
					return "";
				}
				if (url.match(/^\/\//)) {
					url = location.protocol + url;
				}
				if (!url.match(/^(https?|file):/)) {
					BOOMR.error("Passed in URL is invalid: " + url);
					return "";
				}
				if (stripHash) {
					url = url.replace(/#.*/, "");
				}
				if (!BOOMR.utils.MD5) {
					return url;
				}
				return url.replace(/\?([^#]*)/, function(m0, m1) { return "?" + (m1.length > 10 ? BOOMR.utils.MD5(m1) : m1); });
			},

			pluginConfig: function(o, config, plugin_name, properties) {
				BOOMR.debug("pluginConfig_#548");
				var i, props=0;

				if (!config || !config[plugin_name]) {
					return false;
				}

				for (i=0; i<properties.length; i++) {
					if (config[plugin_name][properties[i]] !== undefined) {
						o[properties[i]] = config[plugin_name][properties[i]];
						props++;
					}
				}

				return (props>0);
			},
			/**
			 * `filter` for arrays
			 *
			 * @private
			 * @param {Array} array The array to iterate over.
			 * @param {Function} predicate The function invoked per iteration.
			 * @returns {Array} Returns the new filtered array.
			 */
			arrayFilter: function(array, predicate) {
				BOOMR.debug("arrayFilter_#573");
				var result = [];

				if (typeof array.filter === "function") {
					result = array.filter(predicate);
				}
				else {
					var index = -1,
					    length = array.length,
					    value;

					while (++index < length) {
						value = array[index];
						if (predicate(value, index, array)) {
							result[result.length] = value;
						}
					}
				}
				return result;
			},

			encodeString: function(str) {
				BOOMR.debug("encodeString_#595");
				//Create Base64 security String
				var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9\+\/\=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/\r\n/g,"\n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}}
				return Base64.encode(str);
			},

			/**
			 Add a MutationObserver for a given element and terminate after `timeout`ms.
			 @param el		DOM element to watch for mutations
			 @param config		MutationObserverInit object (https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver#MutationObserverInit)
			 @param timeout		Number of milliseconds of no mutations after which the observer should be automatically disconnected
						If set to a falsy value, the observer will wait indefinitely for Mutations.
			 @param callback	Callback function to call either on timeout or if mutations are detected.  The signature of this method is:
							function(mutations, callback_data)
						Where:
							mutations is the list of mutations detected by the observer or `undefined` if the observer timed out
							callback_data is the passed in `callback_data` parameter without modifications

						The callback function may return a falsy value to disconnect the observer after it returns, or a truthy value to
						keep watching for mutations. If the return value is numeric and greater than 0, then this will be the new timeout
						if it is boolean instead, then the timeout will not fire any more so the caller MUST call disconnect() at some point
			 @param callback_data	Any data to be passed to the callback function as its second parameter
			 @param callback_ctx	An object that represents the `this` object of the `callback` method.  Leave unset the callback function is not a method of an object

			 @returns	- `null` if a MutationObserver could not be created OR
					- An object containing the observer and the timer object:
					  { observer: <MutationObserver>, timer: <Timeout Timer if any> }

					The caller can use this to disconnect the observer at any point by calling `retval.observer.disconnect()`
					Note that the caller should first check to see if `retval.observer` is set before calling `disconnect()` as it may
					have been cleared automatically.
			 */
			addObserver: function(el, config, timeout, callback, callback_data, callback_ctx) {
				BOOMR.debug("addObserver_#628");
				var o = {observer: null, timer: null};

				if (!window.MutationObserver || !callback || !el) {
					return null;
				}

				function done(mutations) {
					var run_again=false;

					if (o.timer) {
						clearTimeout(o.timer);
						o.timer = null;
					}

					if (callback) {
						run_again = callback.call(callback_ctx, mutations, callback_data);

						if (!run_again) {
							callback = null;
						}
					}

					if (!run_again && o.observer) {
						o.observer.disconnect();
						o.observer = null;
					}

					if (typeof run_again === "number" && run_again > 0) {
						o.timer = setTimeout(done, run_again);
					}
				}

				o.observer = new MutationObserver(done);

				if (timeout) {
					o.timer = setTimeout(done, o.timeout);
				}

				o.observer.observe(el, config);

				return o;
			},

			addListener: function(el, type, fn) {
				BOOMR.debug("addListener_#673_" + type);
				if (el.addEventListener) {
					el.addEventListener(type, fn, false);
				}
				else if (el.attachEvent) {
					el.attachEvent( "on" + type, fn );
				}
			},

			removeListener: function(el, type, fn) {
				BOOMR.debug("removeListener_#683");
				if (el.removeEventListener) {
					el.removeEventListener(type, fn, false);
				}
				else if (el.detachEvent) {
					el.detachEvent("on" + type, fn);
				}
			},

			pushVars: function(form, vars, prefix) {
				BOOMR.debug("pushVars_#693");
				var k, i, l=0, input;

				for (k in vars) {
					if (vars.hasOwnProperty(k)) {
						if (Object.prototype.toString.call(vars[k]) === "[object Array]") {
							for (i = 0; i < vars[k].length; ++i) {
								l += BOOMR.utils.pushVars(form, vars[k][i], k + "[" + i + "]");
							}
						}
						else {
							input = document.createElement("input");
							input.type = "hidden";	// we need `hidden` to preserve newlines. see commit message for more details
							input.name = (prefix ? (prefix + "[" + k + "]") : k);
							input.value = (vars[k]===undefined || vars[k]===null ? "" : vars[k]);

							form.appendChild(input);

							l += encodeURIComponent(input.name).length + encodeURIComponent(input.value).length + 2;
						}
					}
				}

				return l;
			},

			sendData: function(form, method) {
				BOOMR.debug("sendData_#720");
				var input = document.createElement("input"),
				    urls = [ impl.beacon_url ];

				form.method = method;
				form.id = "beacon_form";

				// TODO: Determine if we want to send as JSON
				//if (window.JSON) {
				//	form.innerHTML = "";
				//	form.enctype = "text/plain";
				//	input.name = "data";
				//	input.value = JSON.stringify(impl.vars);
				//	form.appendChild(input);
				//} else {
				form.enctype = "application/x-www-form-urlencoded";
				//}

				if (impl.secondary_beacons && impl.secondary_beacons.length) {
					urls.push.apply(urls, impl.secondary_beacons);
				}


				function remove(id) {
					var el = document.getElementById(id);
					if (el) {
						el.parentNode.removeChild(el);
					}
				}

				function submit() {
					/*eslint-disable no-script-url*/
					var iframe,
					    name = "boomerang_post-" + encodeURIComponent(form.action) + "-" + Math.random();

					// ref: http://terminalapp.net/submitting-a-form-with-target-set-to-a-script-generated-iframe-on-ie/
					try {
						iframe = document.createElement('<iframe name="' + name + '">');	// IE <= 8
					}
					catch (ignore) {
						iframe = document.createElement("iframe");				// everything else
					}

					form.action = urls.shift();
					iframe.name = iframe.id = name;

					// IE Edge hangs for a minute on some sites when using form.submit().  This
					// can be avoided by not setting the form.target, and adding the form to the
					// iframe instead of the document.
					iframe.style.display = form.style.display = "none";
					iframe.src="javascript:false";

					remove(iframe.id);
					remove(form.id);

					document.body.appendChild(iframe);

					// Add the form to the iframe
					var iFrmDocument = (iframe.contentWindow || iframe.contentDocument);
					if (iFrmDocument.document) {
						iFrmDocument = iFrmDocument.document;
					}
					if (iFrmDocument.body) {
						iFrmDocument.body.appendChild(form);
					}
					else {
						//body may be null, so add to the document
						iFrmDocument.appendChild(form);
					}

					try {
						form.submit();
					}
					catch (ignore) {
						// empty
					}

					if (urls.length) {
						BOOMR.setImmediate(submit);
					}

					setTimeout(function() { remove(iframe.id); }, 10000);
				}

				submit();
			}
		},

		init: function(config) {
			BOOMR.debug("init_#809");
			var i, k,
			    properties = ["beacon_url", "beacon_type", "site_domain", "user_ip", "strip_query_string", "secondary_beacons", "autorun", "timeout", "beacon_switch", "blacklist", "url_pattern", "beacon_delay", "sample_ratio"];

			BOOMR_check_doc_domain();

			if (!config) {
				config = {};
			}

			for (i=0; i<properties.length; i++) {
				if (config[properties[i]] !== undefined) {
					impl[properties[i]] = config[properties[i]];
				}
			}

			//Check beacon_switch is on AND throttling beacon samples (Math.random() => [0,1))
			if((impl.beacon_switch.toLowerCase() === "on") && (Math.random() < impl.sample_ratio)){
				//check browser compatibility for Resource Timing and User Timing API
				if(!(("performance" in window)&&("timing" in window.performance)&&(performance.now))){
					BOOMR.info("Browser compatibility check failed!");
					return;
				}
				var isMatched = false;
				var url = BOOMR.utils.cleanupURL(d.URL.replace(/#.*/, ""));

				if(Array.isArray(impl.url_pattern)){
					for(var i in impl.url_pattern){
						var filter = impl.url_pattern[i];
						if(filter === "")  continue;

						var regex = new RegExp(filter,"gi");
						if(url.match(regex)){
							isMatched = true;
							break;
						}
					}
				} else {
					if(impl.url_pattern.toUpperCase() === "ALL") {
						BOOMR.info("url_pattern has been set to match all url");
						isMatched = true;
					}
				}

				if (!isMatched){
					BOOMR.info(url + " This URL isn't match, check your url_pattern!");
					return;
				} else {
					BOOMR.info(url + " This URL is matched!");
				}
			} else {
				BOOMR.info("RUM feature not enabled!");
				return;
			}

			//set timeout to beacon
			var t = impl.timeout;
			if (t < 10000) {
				BOOMR.warn("beacon send timeout value is a little bit short...consider to increase it (15 seconds by default)! ");
			}
			impl.timeoutID = w.setTimeout(function(){
				BOOMR.addVar("user_timing", window.performance.now().toFixed(1));
				BOOMR.addVar("timeout", "true");
				BOOMR.page_ready();
			}, t);
			BOOMR.info("Timeout ID Set: " + impl.timeoutID);

			if (config.primary && impl.handlers_attached) {
				return this;
			}

			if (config.site_domain !== undefined) {
				this.session.domain = config.site_domain;
			}

			if (config.log !== undefined) {
				this.log = config.log;
			}
			if (!this.log) {
				this.log = function(/* m,l,s */) {};
			}

			for (k in this.plugins) {
				if (this.plugins.hasOwnProperty(k)) {
					// config[plugin].enabled has been set to false
					if ( config[k]
						&& config[k].hasOwnProperty("enabled")
						&& config[k].enabled === false
					) {
						impl.disabled_plugins[k] = 1;

						continue;
					}

					// plugin was previously disabled
					if (impl.disabled_plugins[k]) {

						// and has not been explicitly re-enabled
						if ( !config[k]
							|| !config[k].hasOwnProperty("enabled")
							|| config[k].enabled !== true
						) {
							continue;
						}

						// plugin is now enabled
						delete impl.disabled_plugins[k];
					}

					// plugin exists and has an init method
					if (typeof this.plugins[k].init === "function") {
						try {
							this.plugins[k].init(config);
						}
						catch (err) {
							BOOMR.addError(err, k + ".init");
						}
					}
				}
			}

			if (impl.handlers_attached) {
				return this;
			}

			// The developer can override onload by setting autorun to false
			if (!impl.onloadfired && (config.autorun === undefined || config.autorun !== false)) {
				if (d.readyState && d.readyState === "complete") {
					BOOMR.loadedLate = true;
					this.setImmediate(BOOMR.page_ready_autorun, null, null, BOOMR);
				}
				else {
					if (w.onpagehide || w.onpagehide === null) {
						BOOMR.utils.addListener(w, "pageshow", BOOMR.page_ready_autorun);
					}
					else {
						BOOMR.utils.addListener(w, "load", BOOMR.page_ready_autorun);
					}
				}
			}

			BOOMR.utils.addListener(w, "DOMContentLoaded", function() { impl.fireEvent("dom_loaded"); });

			(function() {
				var forms, iterator;
				if (visibilityChange !== undefined) {
					BOOMR.debug("addListener_#956_visibilityChange");
					BOOMR.utils.addListener(d, visibilityChange, function() { impl.fireEvent("visibility_changed"); });

					// record the last time each visibility state occurred
					BOOMR.subscribe("visibility_changed", function() {
						BOOMR.lastVisibilityEvent[BOOMR.visibilityState()] = BOOMR.now();
					});
				}
				BOOMR.debug("addListener_#964_mouseup");
				BOOMR.utils.addListener(d, "mouseup", impl.xb_handler("click"));

				forms = d.getElementsByTagName("form");
				for (iterator = 0; iterator < forms.length; iterator++) {
					BOOMR.debug("addListener_#969_formsubmit");
					BOOMR.utils.addListener(forms[iterator], "submit", impl.xb_handler("form_submit"));
				}

				if (!w.onpagehide && w.onpagehide !== null) {
					// This must be the last one to fire
					// We only clear w on browsers that don't support onpagehide because
					// those that do are new enough to not have memory leak problems of
					// some older browsers
					BOOMR.debug("addListener_#978_unload");
					BOOMR.utils.addListener(w, "unload", function() { BOOMR.window=w=null; });
				}
			}());

			impl.handlers_attached = true;
			return this;
		},
		/**
		 * Sends the page_ready beacon only if 'autorun' is still true after config.js
		 * arrives.
		 */
		page_ready_autorun: function(ev) {
			if (impl.autorun) {
				BOOMR.page_ready(ev);
			}
		},

		// The page dev calls this method when they determine the page is usable.
		// Only call this if autorun is explicitly set to false
		page_ready: function(ev) {
			BOOMR.debug("page_ready_#995");
			if (!ev) { ev = w.event; }
			if (!ev) { ev = { name: "load" }; }
			if (impl.onloadfired) {
				return this;
			}
			impl.fireEvent("page_ready", ev);
			impl.onloadfired = true;
			BOOMR.disableTimeOut();
			return this;
		},

		disableTimeOut: function(){
			BOOMR.debug("disableTimeOut_#1008");
			if(typeof impl.timeoutID !== "undefined"){
				w.clearTimeout(impl.timeoutID);
				BOOMR.info("Timeout ID Cleared: " + impl.timeoutID);
			}
		},

		setImmediate: function(fn, data, cb_data, cb_scope) {
			BOOMR.debug("setImmediate_#1016");
			var cb, cstack;

			// DEBUG: This is to help debugging, we'll see where setImmediate calls were made from
			if (typeof Error !== "undefined") {
				cstack = new Error();
				cstack = cstack.stack ? cstack.stack.replace(/^Error/, "Called") : undefined;
			}
			// END-DEBUG

			cb = function() {
				fn.call(cb_scope || null, data, cb_data || {}, cstack);
				cb=null;
			};

			if (w.setImmediate) {
				w.setImmediate(cb);
			}
			else if (w.msSetImmediate) {
				w.msSetImmediate(cb);
			}
			else if (w.webkitSetImmediate) {
				w.webkitSetImmediate(cb);
			}
			else if (w.mozSetImmediate) {
				w.mozSetImmediate(cb);
			}
			else {
				setTimeout(cb, 10);
			}
		},

		now: (function() {
			//BOOMR.debug("now_#1049");
			try {
				if ("performance" in window && window.performance && window.performance.now) {
					return function() {
						return Math.round(window.performance.now() + window.performance.timing.navigationStart);
					};
				}
			}
			catch (ignore) {
				// empty
			}

			return Date.now || function() { return new Date().getTime(); };
		}()),

		visibilityState: ( visibilityState === undefined ? function() { return "visible"; } : function() { return d[visibilityState]; } ),

		lastVisibilityEvent: {},

		subscribe: function(e_name, fn, cb_data, cb_scope) {
			BOOMR.debug("subscribe_#1070_" + e_name);
			var i, handler, ev;

			e_name = e_name.toLowerCase();

			if (!impl.events.hasOwnProperty(e_name)) {
				return this;
			}

			ev = impl.events[e_name];

			// don't allow a handler to be attached more than once to the same event
			for (i=0; i<ev.length; i++) {
				handler = ev[i];
				if (handler && handler.fn === fn && handler.cb_data === cb_data && handler.scope === cb_scope) {
					return this;
				}
			}
			ev.push({ "fn": fn, "cb_data": cb_data || {}, "scope": cb_scope || null });

			// attaching to page_ready after onload fires, so call soon
			if (e_name === "page_ready" && impl.onloadfired) {
				this.setImmediate(fn, null, cb_data, cb_scope);
			}

			// Attach unload handlers directly to the window.onunload and
			// window.onbeforeunload events. The first of the two to fire will clear
			// fn so that the second doesn't fire. We do this because technically
			// onbeforeunload is the right event to fire, but all browsers don't
			// support it.  This allows us to fall back to onunload when onbeforeunload
			// isn't implemented
			if (e_name === "page_unload" || e_name === "before_unload") {
				(function() {
					var unload_handler, evt_idx = ev.length;

					unload_handler = function(evt) {
								if (fn) {
									fn.call(cb_scope, evt || w.event, cb_data);
								}

								// If this was the last unload handler, we'll try to send the beacon immediately after it is done
								// The beacon will only be sent if one of the handlers has queued it
								if (e_name === "page_unload" && evt_idx === impl.events[e_name].length) {
									BOOMR.real_sendBeacon();
								}
							};

					if (e_name === "page_unload") {
						// pagehide is for iOS devices
						// see http://www.webkit.org/blog/516/webkit-page-cache-ii-the-unload-event/
						if (w.onpagehide || w.onpagehide === null) {
							BOOMR.utils.addListener(w, "pagehide", unload_handler);
						}
						else {
							BOOMR.utils.addListener(w, "unload", unload_handler);
						}
					}
					BOOMR.utils.addListener(w, "beforeunload", unload_handler);
				}());
			}

			return this;
		},

		addError: function(err, src, extra) {
			BOOMR.debug("addError_#1134");
			var str;
			if (typeof err !== "string") {
				str = String(err);
				if (str.match(/^\[object/)) {
					str = err.name + ": " + (err.description || err.message).replace(/\r\n$/, "");
				}
				err = str;
			}
			if (src !== undefined) {
				err = "[" + src + ":" + BOOMR.now() + "] " + err;
			}
			if (extra) {
				err += ":: " + extra;
			}

			if (impl.errors[err]) {
				impl.errors[err]++;
			}
			else {
				impl.errors[err] = 1;
			}
		},

		isCrossOriginError: function(err) {
			BOOMR.debug("isCrossOriginError_#1159");
			// These are expected for cross-origin iframe access, although the Internet Explorer check will only
			// work for browsers using English.
			return err.name === "SecurityError" ||
				(err.name === "TypeError" && err.message === "Permission denied") ||
				(err.name === "Error" && err.message && err.message.match(/^(Permission|Access is) denied/));
		},

		addVar: function(name, value) {
			BOOMR.debug("addVar_#1168_" + name);
			if (typeof name === "string") {
				impl.vars[name] = value;
			}
			else if (typeof name === "object") {
				var o = name, k;
				for (k in o) {
					if (o.hasOwnProperty(k)) {
						impl.vars[k] = o[k];
					}
				}
			}
			return this;
		},

		removeVar: function(arg0) {
			BOOMR.debug("removeVar_#1184");
			var i, params;
			if (!arguments.length) {
				return this;
			}

			if (arguments.length === 1
					&& Object.prototype.toString.apply(arg0) === "[object Array]") {
				params = arg0;
			}
			else {
				params = arguments;
			}

			for (i=0; i<params.length; i++) {
				if (impl.vars.hasOwnProperty(params[i])) {
					delete impl.vars[params[i]];
				}
			}

			return this;
		},

		clearVars: function(){
			BOOMR.debug("clearVars_#1208");
			impl.vars = {};
		},

		hasVar: function(name) {
			BOOMR.debug("hasVar_#1213");
			return impl.vars.hasOwnProperty(name);
		},

		requestStart: function(name) {
			BOOMR.debug("requestStart_#1218");
			var t_start = BOOMR.now();
			BOOMR.plugins.RT.startTimer("xhr_" + name, t_start);

			return {
				loaded: function(data) {
					BOOMR.responseEnd(name, t_start, data);
				}
			};
		},

		responseEnd: function(name, t_start, data) {
			BOOMR.debug("responseEnd_#1230");
			if (typeof name === "object" && name.url) {
				impl.fireEvent("xhr_load", name);
			}
			else {
				BOOMR.plugins.RT.startTimer("xhr_" + name, t_start);
				impl.fireEvent("xhr_load", {
					"name": "xhr_" + name,
					"data": data
				});
			}
		},

		//
		// uninstrumentXHR and instrumentXHR are stubs that will be replaced
		// by auto_xhr.js if active.
		//
		/**
		 * Undo XMLHttpRequest instrumentation and reset the original
		 */
		uninstrumentXHR: function() {},
		/**
		 * Instrument all requests made via XMLHttpRequest to send beacons
		 * This is implemented in plugins/auto_xhr.js
		 */
		instrumentXHR: function() {},

		sendBeacon: function(beacon_url_override) {
			BOOMR.debug("sendBeacon_#1258");
			// This plugin wants the beacon to go somewhere else,
			// so update the location
			if (beacon_url_override) { //beacon_url_override is undefined in rt.js
				impl.beacon_url = beacon_url_override;
			}

			if (!impl.beaconQueued) { //beaconQueued is undefined
				impl.beaconQueued = true;
				BOOMR.setImmediate(BOOMR.real_sendBeacon, null, null, BOOMR);
			}

			return true;
		},

		real_sendBeacon: function() {
			BOOMR.debug("real_sendBeacon_#1274");
			var k, form, length=0, errors=[];

			if (!impl.beaconQueued) {
				return false;
			}

			impl.beaconQueued = false;

			BOOMR.debug("Checking if we can send beacon");

			// At this point someone is ready to send the beacon.  We send
			// the beacon only if all plugins have finished doing what they
			// wanted to do
			for (k in this.plugins) {
				if (this.plugins.hasOwnProperty(k)) {
					if (impl.disabled_plugins[k]) {
						continue;
					}
					if (!this.plugins[k].is_complete()) {
						BOOMR.debug("Plugin " + k + " is not complete, deferring beacon send");
						return false;
					}
				}
			}

			// For SPA apps, don't strip hashtags as some SPA frameworks use #s for tracking routes
			// instead of History pushState() APIs. Use d.URL instead of location.href because of a
			// Safari bug.
			var isSPA = impl.vars["http.initiator"] === "spa";
			var pgu = isSPA ? d.URL : d.URL.replace(/#.*/, "");
			impl.vars.pgu = BOOMR.utils.cleanupURL(pgu);

			// Use the current document.URL if it hasn't already been set, or for SPA apps,
			// on each new beacon (since each SPA soft navigation might change the URL)
			if (!impl.vars.u || isSPA) {
				impl.vars.u = impl.vars.pgu;
			}

			if (impl.vars.pgu === impl.vars.u) {
				delete impl.vars.pgu;
			}

			impl.vars.v = BOOMR.version;

			if (BOOMR.visibilityState()) {
				impl.vars["vis.st"] = BOOMR.visibilityState();
				if (BOOMR.lastVisibilityEvent.visible) {
					impl.vars["vis.lv"] = BOOMR.now() - BOOMR.lastVisibilityEvent.visible;
				}
				if (BOOMR.lastVisibilityEvent.hidden) {
					impl.vars["vis.lh"] = BOOMR.now() - BOOMR.lastVisibilityEvent.hidden;
				}
			}

			//impl.vars["ua.plt"] = navigator.platform;
			//impl.vars["ua.vnd"] = navigator.vendor;

			if (w !== window) {
				impl.vars["if"] = "";
			}

			for (k in impl.errors) {
				if (impl.errors.hasOwnProperty(k)) {
					errors.push(k + (impl.errors[k] > 1 ? " (*" + impl.errors[k] + ")" : ""));
				}
			}

			if (errors.length > 0) {
				impl.vars.errors = errors.join("\n");
			}

			impl.errors = {};

			// If we reach here, all plugins have completed
			impl.fireEvent("before_beacon", impl.vars);

			//Add Var for security
			var hashString = BOOMR.utils.encodeString(window.performance.timing.navigationStart + "_" + impl.vars["user_timing"] + "_" + Date.now());
			BOOMR.addVar("_",hashString);

			// Don't send a beacon if no beacon_url has been set
			// you would do this if you want to do some fancy beacon handling
			// in the `before_beacon` event instead of a simple GET request
			BOOMR.debug("Ready to send beacon: " + BOOMR.utils.objectToString(impl.vars));
			if (!impl.beacon_url) {
				BOOMR.debug("No beacon URL, so skipping.");
				return true;
			}

			//remove vars defined in blacklist
			for(name in impl.vars){
				if(impl.blacklist.indexOf(name) !== -1)  delete impl.vars[ name ];
			}

			form = document.createElement("form");
			length = BOOMR.utils.pushVars(form, impl.vars);

			// If we reach here, we've transferred all vars to the beacon URL.
			impl.fireEvent("onbeacon", impl.vars);

			if (length === 0) {
				// do not make the request if there is no data
				return this;
			}

			//delay sending beacon
			var t = impl.beacon_delay;
			if (t>0 && impl.vars["timeout"] !== "true"){
				impl.beaconDelayID = w.setTimeout(function(){
					BOOMR.utils.sendData(form, impl.beacon_type === "AUTO" ? (length > 2000 ? "POST" : "GET") : "POST");
					BOOMR.info("Beacon sent on :" + Date.now());
				}, t);

				BOOMR.info("Beacon delay timeoutID Set:"+ impl.beaconDelayID);

			} else {
				// using 2000 here as a de facto maximum URL length based on:
				// http://stackoverflow.com/questions/417142/what-is-the-maximum-length-of-a-url-in-different-browsers
				BOOMR.utils.sendData(form, impl.beacon_type === "AUTO" ? (length > 2000 ? "POST" : "GET") : "POST");
				BOOMR.info("Beacon sent on :" + Date.now());
			}

			BOOMR.clearVars();

			return true;
		}

	};

	delete BOOMR_start;

	if (typeof BOOMR_lstart === "number") {
		boomr.t_lstart = BOOMR_lstart;
		delete BOOMR_lstart;
	}
	else if (typeof BOOMR.window.BOOMR_lstart === "number") {
		boomr.t_lstart = BOOMR.window.BOOMR_lstart;
	}

	if (typeof BOOMR.window.BOOMR_onload === "number") {
		boomr.t_onload = BOOMR.window.BOOMR_onload;
	}

	(function() {
		var make_logger;

		if (typeof console === "object" && console.log !== undefined) {
			boomr.log = function(m, l, s) { console.log(s + ": [" + l + "] " + m); };
		}

		make_logger = function(l) {
			return function(m, s) {
				this.log(m, l, "boomerang" + (s?"."+s:""));
				return this;
			};
		};

		boomr.debug = make_logger("debug");
		boomr.info = make_logger("info");
		boomr.warn = make_logger("warn");
		boomr.error = make_logger("error");
	}());


	(function() {
		var ident;
		for (ident in boomr) {
			if (boomr.hasOwnProperty(ident)) {
				BOOMR[ident] = boomr[ident];
			}
		}
		if (!BOOMR.xhr_excludes) {
			//! URLs to exclude from automatic XHR instrumentation
			BOOMR.xhr_excludes={};
		}
	}());

	dispatchEvent("onBoomerangLoaded", { "BOOMR": BOOMR }, true );

}(window));

// end of boomerang beaconing section