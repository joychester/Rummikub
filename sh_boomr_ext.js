
var SHBoomrModule = (function () {
    "use strict";

    var shBoomrExt = {};

    var ON = "ON";
    var OFF = "OFF";
    var STRING_TYPE = "string";
    var HTTP_POST = "POST";
    var HTTP_GET = "GET";

    //===customized parameters used in BOOMR.init();===
    var beacon_switch = ON; //ON or OFF

    var beaconTimeout = 10000; //in ms

    //Here we define a group of regex patterns, If one of them matched then the url will be tracked.
    //The keyword "ALL" means all url will NOT be filtered, case ignored
    //or define a Regex array: ["(^(http(s)?(:\/\/))?(www.)?)(domainname.(com|co.uk|de|fr))([-a-zA-Z0-9:%_+.~#?&//=]*)"],
    var url_pattern = ["(.*\/login$)", "(.*\/home$)"];

    //===customized parameters used in BOOMR.sendData();===
    var blacklist = [
        "v", // Boomerang parameters
        "rt.start", "rt.tstart", "rt.bstart", "rt.end", "r", "vis.st", "vis.lh", "r2" //roundtrip plugin params
        //other plugins parameters
    ];

    var beacon_delay = 3000; //in ms

    var sample_ratio = 1; // 1 means enable 100% samples

    /**
     * Create Base64 security string.
     *
     * @method _encodeB64String
     * @param str {String} token needs to be encoded
     * @return {String} Returns Base64 encoded string
     */
    function _encodeB64String(str) {
        var Base64 = {
            _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
            encode: function (e) {
                var t = "";
                var n, r, i, s, o, u, a;
                var f = 0;
                e = Base64._utf8_encode(e);
                while (f < e.length) {
                    n = e.charCodeAt(f++);
                    r = e.charCodeAt(f++);
                    i = e.charCodeAt(f++);
                    s = n >> 2;
                    o = (n & 3) << 4 | r >> 4;
                    u = (r & 15) << 2 | i >> 6;
                    a = i & 63;
                    if (isNaN(r)) {
                        u = a = 64
                    } else if (isNaN(i)) {
                        a = 64
                    }
                    t = t + this._keyStr.charAt(s) + this._keyStr.charAt(o) + this._keyStr.charAt(u) + this._keyStr.charAt(a)
                }
                return t
            },
            decode: function (e) {
                var t = "";
                var n, r, i;
                var s, o, u, a;
                var f = 0;
                e = e.replace(/[^A-Za-z0-9\+\/\=]/g, "");
                while (f < e.length) {
                    s = this._keyStr.indexOf(e.charAt(f++));
                    o = this._keyStr.indexOf(e.charAt(f++));
                    u = this._keyStr.indexOf(e.charAt(f++));
                    a = this._keyStr.indexOf(e.charAt(f++));
                    n = s << 2 | o >> 4;
                    r = (o & 15) << 4 | u >> 2;
                    i = (u & 3) << 6 | a;
                    t = t + String.fromCharCode(n);
                    if (u != 64) {
                        t = t + String.fromCharCode(r)
                    }
                    if (a != 64) {
                        t = t + String.fromCharCode(i)
                    }
                }
                t = Base64._utf8_decode(t);
                return t
            },
            _utf8_encode: function (e) {
                e = e.replace(/\r\n/g, "\n");
                var t = "";
                for (var n = 0; n < e.length; n++) {
                    var r = e.charCodeAt(n);
                    if (r < 128) {
                        t += String.fromCharCode(r)
                    } else if (r > 127 && r < 2048) {
                        t += String.fromCharCode(r >> 6 | 192);
                        t += String.fromCharCode(r & 63 | 128)
                    } else {
                        t += String.fromCharCode(r >> 12 | 224);
                        t += String.fromCharCode(r >> 6 & 63 | 128);
                        t += String.fromCharCode(r & 63 | 128)
                    }
                }
                return t
            },
            _utf8_decode: function (e) {
                var t = "";
                var n = 0;
                var r = c1 = c2 = 0;
                while (n < e.length) {
                    r = e.charCodeAt(n);
                    if (r < 128) {
                        t += String.fromCharCode(r);
                        n++
                    } else if (r > 191 && r < 224) {
                        c2 = e.charCodeAt(n + 1);
                        t += String.fromCharCode((r & 31) << 6 | c2 & 63);
                        n += 2
                    } else {
                        c2 = e.charCodeAt(n + 1);
                        c3 = e.charCodeAt(n + 2);
                        t += String.fromCharCode((r & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
                        n += 3
                    }
                }
                return t
            }
        }
        return Base64.encode(str);
    };
    /**
     * Stops the execution of the function specified in setTimeout()
     *
     * @method _disableTimeOut
     * @param timeoutId {number} timeoutID generated by setTimeout()
     */
    function _disableTimeOut(timeoutId) {
        if (typeof timeoutId !== "undefined") {
            clearTimeout(timeoutId);
            BOOMR.info("Timeout ID Cleared: " + timeoutId);
        }
    };

    /**
     * Check 'beacon_switch', 'sample_ratio', 'url_pattern' and 'browser compatibility' properties,
     * to decide whether the page will send the beacon or not
     * @method getBeaconDelayVal
     * @return {number} Returns beacon_delay value
     */
    shBoomrExt.getBeaconDelayVal = function () {
        return beacon_delay;
    };
    /**
     * Check 'beacon_switch', 'sample_ratio', 'url_pattern' and 'browser compatibility' properties,
     * to decide whether the page will send the beacon or not
     * @method isBeaconEnabled
     * @param doc {object} the root node of the HTML document and the "owner" of all other nodes
     * @return {boolean} Returns true if beacon can be enabled on current page
     */
    shBoomrExt.isBeaconEnabled = function (doc) {
        //cache BOOMR Global obj, especially it is used more than once
        var boomr = BOOMR;
        var isMatched = false;
        var url = boomr.utils.cleanupURL(doc.URL.replace(/#.*/, ""));
        var urlRegex = url_pattern;

        //Check beacon_switch is on AND throttling beacon samples (Math.random() => [0,1))
        if ((beacon_switch.toUpperCase() === ON) && (Math.random() < sample_ratio)) {
            //check browser compatibility for Resource Timing and User Timing API
            if (!((window.performance) && (window.performance.timing) && (window.performance.now))) {
                boomr.info("Browser compatibility check failed!");
                return false;
            }

            if (Array.isArray(urlRegex)) {
                for (var i in urlRegex) {
                    var filter = urlRegex[i];
                    if (filter === "") continue;

                    var regex = new RegExp(filter, "gi");
                    if (url.match(regex)) {
                        isMatched = true;
                        break;
                    }
                }
            } else {
                if (url_regex.toUpperCase() === "ALL") {
                    boomr.info("url_pattern has been set to match all url");
                    isMatched = true;
                }
            }

            if (!isMatched) {
                boomr.info(url + " This URL isn't match, check your url_pattern!");
                return false;
            } else {
                boomr.info(url + " This URL is matched!");
                return true;
            }
        } else {
            boomr.info("RUM feature not enabled!");
            return false;
        }
    };

    /**
     * Add user defined metrics on their pages through User Timing API
     * @method addUMVar
     * @param varName {String} User defined variable name
     * @param markName {String} Specified mark name on the page defined by developer
     * @return {object} Returns BOOMR object
     */
    shBoomrExt.addUMVar = function (varName, markName) {
        var boomr = BOOMR;
        var value = 0;

        if (performance.getEntriesByName) {
            if (typeof varName === STRING_TYPE && typeof markName === STRING_TYPE) {
                value = window.performance.getEntriesByName(markName)[0].startTime.toFixed(1);
                if (!boomr.hasVar(varName)) {
                    boomr.addVar(varName, value);
                } else {
                    //if var name is duplicated , give a warning and override anyway
                    boomr.warn("overriding the var: " + varName);
                    boomr.addVar(varName, value);
                }
            }
        } else {
            boomr.debug("performance.getEntriesByName() method is not supported yet");
        }
        return this;
    };

    /**
     * Add navigation timing measurements into beacon Vars, the same purpose to use navtiming.js plugin
     * currently support navigationStart, connectEnd, domComplete, loadEventEnd
     * @method addNavTimingVars
     */
    shBoomrExt.addNavTimingVars = function () {
        var boomr = BOOMR;
        var w = boomr.window, p, pn, pt, data;

        if (this.complete) {
          return this;
        }

        p = w.performance || w.msPerformance || w.webkitPerformance || w.mozPerformance;
        if (p && p.timing && p.navigation) {
            boomr.debug("This user agent supports NavigationTiming.");
            pt = p.timing;
            data = {
              nt_nav_st: pt.navigationStart,
              nt_con_end: pt.connectEnd,
              nt_domcomp: pt.domComplete,
              nt_load_end: pt.loadEventEnd
            };
            boomr.addVar(data);
        } else {
          boomr.debug("This user agent does not supports NavigationTiming.");
        }
    };

    /**
     * Add Base64 security token to BOOMR Vars
     * @method addSecurityVar
     */
    shBoomrExt.addSecurityVar = function () {
        var boomr = BOOMR;
        var secToken = "";

        if (boomr.hasVar("user_timing")) {
            //var hashString = shBoomrExt.encodeB64String(window.performance.timing.navigationStart + "_" + boomr.getVar("user_timing") + "_" + new Date().getTime());
            secToken = _encodeB64String(window.performance.timing.navigationStart + "_" + boomr.getVar("user_timing") + "_" + new Date().getTime());
            boomr.addVar("_", secToken);
        } else {
            boomr.addVar("_", "user_timing_undefined");;
        }
    };

    /**
     * remove unwanted Vars in user defined variable blacklist from BOOMR Vars
     * @method removeVarsFromBlacklist
     */
    shBoomrExt.removeVarsFromBlacklist = function () {
        var boomr = BOOMR;
        var blacklistArray = blacklist;
        var boomrVars = boomr.getAllVars();

        for (var varName in boomrVars) {
            if (blacklistArray.indexOf(varName) !== -1) {
                boomr.removeVar(varName);
            }
        }
    };

    /**
     * wait a period of time to send beacon
     * @method deplayToSendBeacon
     * @param form {object} The form element in order to send beacon
     * @param impl {object} Access to BOOMR properties by impl object
     * @param urlLength {number} the length of all added variables in BOOMR
     */
    shBoomrExt.deplayToSendBeacon = function (form, impl, urlLength) {
        var boomr = BOOMR;
        var delayInMs = beacon_delay;

        var beaconDelayID = setTimeout(function () {
            boomr.utils.sendData(form, impl.beacon_type === "AUTO" ? (urlLength > 2000 ? HTTP_POST : HTTP_GET) : HTTP_POST);
            boomr.info("Beacon sent on :" + Date.now());
        }, delayInMs);

        boomr.info("Beacon delay timeoutID Set:" + beaconDelayID);
    };

    /**
     * Add timeout flag and send beacon out by trigger page_ready()
     * This basically cover 2 scenarios : page slow until timeout or no page_ready() triggered on the page
     * @method sendTimeoutBeacon
     */
    shBoomrExt.sendTimeoutBeacon = function () {
        var boomr = BOOMR;
        var t = beaconTimeout;

        if (t < 10000) {
            boomr.warn("beacon send timeout value is a little bit short...consider to increase it (15 seconds by default)! ");
        }
        var timeoutID = setTimeout(function () {
            //user_timing set to timeout value and set timeout flag to true, then fire the beacon
            boomr.addVar("user_timing", window.performance.now().toFixed(1));
            boomr.addVar("timeout", "true");
            boomr.page_ready();
            _disableTimeOut(timeoutID);
        }, t);
        boomr.info("Timeout ID Set: " + timeoutID);
    };

    return shBoomrExt;
}());
