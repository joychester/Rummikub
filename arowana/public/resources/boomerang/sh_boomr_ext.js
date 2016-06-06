var shBoomrExt = {
  //sh customized properties with default value
  //===customized parameters used in BOOMR.init();===
  beacon_switch: "on", //"off", ignore case

  timeout: 10000, //in ms

  //Here we define a group of regex patterns, If one of them matched then the url will be tracked.
  //The keyword "ALL" means all url will NOT be filtered, case ignored
  //or define a Regex array: ["(^(http(s)?(:\/\/))?(www.)?)(domainname.(com|co.uk|de|fr))([-a-zA-Z0-9:%_+.~#?&//=]*)"],
  url_pattern: ["(.*\/login$)", "(.*\/home$)"],

  //===customized parameters used in BOOMR.sendData();===
  blacklist: [
              "v",// Boomerang parameters
              "rt.start","rt.tstart","rt.bstart","rt.end","r","vis.st","vis.lh","r2" //roundtrip plugin parameters
              //other plugins parameters
              ],

  beacon_delay: 1000, //in ms

  sample_ratio: 1, // 1 means enable 100% samples

  //sh customized functions
  //Create Base64 security String
  encodeB64String: function(str) {
    "use strict";
    var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9\+\/\=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/\r\n/g,"\n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}}
    return Base64.encode(str);
  },

  disableTimeOut: function(timeoutId) {
    if(typeof timeoutId !== "undefined"){
      clearTimeout(timeoutId);
      BOOMR.info("Timeout ID Cleared: " + timeoutId);
    }
  },

  //beacon_switch, sample_ratio, url_pattern and browser compatibility check
  beaconSwitchCheck: function(doc) {
    //Check beacon_switch is on AND throttling beacon samples (Math.random() => [0,1))
    if((shBoomrExt.beacon_switch.toLowerCase() === "on") && (Math.random() < shBoomrExt.sample_ratio)) {
      //check browser compatibility for Resource Timing and User Timing API
      if(!(("performance" in window)&&("timing" in window.performance)&&(performance.now))) {
        BOOMR.info("Browser compatibility check failed!");
        return;
      }
      var isMatched = false;
      var url = BOOMR.utils.cleanupURL(doc.URL.replace(/#.*/, ""));

      var url_regex = shBoomrExt.url_pattern;
      if (Array.isArray(url_regex)) {
        for (var i in url_regex) {
          var filter = url_regex[i];
          if (filter === "")  continue;

          var regex = new RegExp(filter,"gi");
          if (url.match(regex)) {
            isMatched = true;
            break;
          }
        }
      } else {
        if (url_regex.toUpperCase() === "ALL") {
          BOOMR.info("url_pattern has been set to match all url");
          isMatched = true;
        }
      }

      if (!isMatched) {
        BOOMR.info(url + " This URL isn't match, check your url_pattern!");
        return;
      } else {
        BOOMR.info(url + " This URL is matched!");
      }
    } else {
      BOOMR.info("RUM feature not enabled!");
      return;
    }
  },

  //add user defined metrics on their pages with User Timing API, (string, string) supported
  addUMVar: function(var_name, mark_name) {
    if(performance.getEntriesByName) {
      if (typeof var_name === "string" && typeof mark_name === "string") {
        value = window.performance.getEntriesByName(mark_name)[0].startTime.toFixed(1);
        if (!BOOMR.hasVar(var_name)) {
          BOOMR.addVar(var_name, value);
        } else {
          //if var name is duplicated , give a warning and override anyway
          BOOMR.warn("overriding the var: " + var_name);
          BOOMR.addVar(var_name, value);
        }
      }
    } else {
        BOOMR.debug("performance.getEntriesByName() method is not supported yet");
    }
    return this;
  },

  addSecurityVar: function() {
    if (BOOMR.hasVar("user_timing")) {
      var hashString = shBoomrExt.encodeB64String(window.performance.timing.navigationStart + "_" + BOOMR.getVar("user_timing") + "_" + new Date().getTime());
      BOOMR.addVar("_",hashString);
    } else {
      BOOMR.addVar("_","user_timing_undefined");;
    }
  },

  removeVarsFromBlacklist: function() {
    var blacklistArray= shBoomrExt.blacklist;
    var boomrVars = BOOMR.getAllVars();
    for(name in boomrVars){
      if(blacklistArray.indexOf(name) !== -1) {
        BOOMR.removeVar(name);
      }
    }
  },

  //delay sending beacon
  deplayToSendBeacon: function(form, impl, urlLength) {
    var delayInMs = shBoomrExt.beacon_delay;
    var beaconDelayID = setTimeout(function(){
      BOOMR.utils.sendData(form, impl.beacon_type === "AUTO" ? (urlLength > 2000 ? "POST" : "GET") : "POST");
      BOOMR.info("Beacon sent on :" + Date.now());
    }, delayInMs);

    BOOMR.info("Beacon delay timeoutID Set:"+ beaconDelayID);
  },

  //set timeout to send beacon out, cover 2 cases: page timeout or no page_ready() defined on the page
  sendTimeoutBeacon: function() {
    var t = shBoomrExt.timeout;
    if (t < 10000) {
      BOOMR.warn("beacon send timeout value is a little bit short...consider to increase it (15 seconds by default)! ");
    }
    var timeoutID = setTimeout(function(){
      //user_timing set to timeout value and set timeout flag to true, then fire the beacon
      BOOMR.addVar("user_timing", window.performance.now().toFixed(1));
      BOOMR.addVar("timeout", "true");
      BOOMR.page_ready();
      shBoomrExt.disableTimeOut(timeoutID);
    }, t);
    BOOMR.info("Timeout ID Set: " + timeoutID);
  }
}
