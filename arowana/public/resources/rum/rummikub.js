var Rummikub = (function() {
    'use strict';

    var STRING_TYPE = 'string',
        isRUMEnabled = false,

        // impl is a private object
        impl = {
            beacon_url: 'http://127.0.0.1:9292/rest/beacon',

            beaconTimeout_ms: 15000,

            /* Here we define a group of regex patterns, If one of them matched then the url will be tracked.
             * The keyword "ALL" means all url will NOT be filtered, case ignored
             */
            url_pattern: '',

            beacon_delay_ms: 3000,

            // Range:[0,1], 1 means enable 100% samples
            pass_ratio: 0,

            // vars hold key-value pairs for perf metrics
            vars: {},

            isBeaconFired: false,

            timeoutID: 0
        };

    /**
     * Return all perf metrics in impl.vars
     *
     * @return {string} all perf metrics in json format
     */
    function getAllVars() {
        return JSON.stringify(impl.vars);
    }

    /**
     * Add perf measurement to impl.vars
     * @param {object} name the name of performance measurements
     * @param {object} value the value of performance measurements
     */
    function addVar(name, value) {

        if (typeof name === STRING_TYPE) {
            impl.vars[name] = value;
            console.debug('Rummikub: var added: ' + impl.vars[name]);
        } else if (typeof name === 'object') {
            //require underscore.js loaded
            _.extend(impl.vars, name);
        }
    }

    /**
     * Return true or false by given a perf measurement name
     * @param {string} name the name of performance measurements
     *
     * @return {boolean} return true if impl.vars has this property, otherwise return false
     */
    function hasVar(name) {
        return impl.vars.hasOwnProperty(name);
    }

    /**
     * Send RUM Beacon POST Request by Beacon API
     * @param {string} perf_beacon the RUM Data with json format
     */
    function sendReqByBeaconAPI(perf_beacon) {
        console.debug('Rummikub: using Beacon API to send beacon at: ' + Date.now());

        window.navigator.sendBeacon(impl.beacon_url, perf_beacon);
    }

    /**
     * Send RUM Beacon POST Request by XHRRequest
     * @param {string} perf_beacon the RUM Data with json format
     */
    function sendReqByXHR(perf_beacon) {
        console.debug('Rummikub: using XMLHttpRequest Post to send beacon at : ' + Date.now());

        var xhr = new XMLHttpRequest();
        xhr.open('POST', impl.beacon_url);
        // xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(perf_beacon);
    }

    /**
     * Clear timer ID to cancel Beacon Timeout timer
     * @param {number} beaconTimerID The ID of Timeout Beacon Timer
     */
    function cancelTimeoutBeacon(beaconTimerID) {
        console.debug('Rummikub: TimeoutID ' + beaconTimerID + ' cleared');

        clearTimeout(beaconTimerID);
    }

    /**
     * Check 'pass_ratio', 'url_pattern' properties,
     * to decide whether the page will send the beacon or not
     * 
     * @return {boolean} Returns true if beacon can be enabled on current page
     */
    isRUMEnabled = (function() {
        var w = window,
            urlPath = w.location.pathname,
            urlRegex = [],
            isEnabled = false;

        console.debug('Rummikub: Check isRUMEnabled');
        try {
            // Load pass_ratio from Global Registry, for example:
            impl.pass_ratio = 1;

            // Check throttling beacon samples and browser compatibility
            if (impl.pass_ratio && (Math.random() < impl.pass_ratio) && urlPath &&
                w.performance && w.performance.now && w.performance.timing) {
                // load url_pattern properties from Global Registry, for example:
                impl.url_pattern = '(^/login$),(^/home$)';

                if (impl.url_pattern.toUpperCase() === 'ALL') {
                    // urlRegex can be set to 'ALL' to match all URL patterns
                    console.info('Rummikub: url_pattern has been set to match all url');
                    isEnabled = true;
                } else if (impl.url_pattern) {
                    urlRegex = impl.url_pattern.split(',');
                    // check if any regex match urlPath
                    isEnabled = urlRegex.some(function(filter) {
                        var filter_regex = new RegExp(filter.trim());
                        return (filter && filter_regex.test && filter_regex.test(urlPath));
                    });
                }
            } else {
                console.info('Rummikub: RUM feature not enabled!');
            }
        } catch (ex) {
            console.warn('Rummikub: Something wrong with compatibility check, disable RUM anyway');
            isEnabled = false;
        }

        return isEnabled;
    })();

    /**
     * Add User Defined Metrics by User Tming API to impl.vars
     * @param {string} varName The varibale name for this custom metric
     * @param {string} markName A performance mark probed by developer
     */
    function addCustomMetrics(varName, markName) {
        var w = window,
            perfMark = [],
            value = '0';

        console.debug('Rummikub: addCustomMetrics() Start');
        if (isRUMEnabled && !impl.isBeaconFired && w.performance.getEntriesByName) {
            perfMark = w.performance.getEntriesByName(markName);
            value = perfMark && perfMark[0] && perfMark[0].startTime.toFixed(1);

            if (!hasVar(varName) && value) {
                addVar(varName, value);
            } else {
                console.warn('Rummikub: duplicated the varName or undefined value');
            }
        } else {
            console.warn('Rummikub: Not able to add Custom Metrics');
        }
    }

    /**
     * Add page latency since navigationStart property to impl.vars
     * @param {string} varName The varibale name for the timer
     */
    function addStopWatch(varName) {
        var value = '0.0';

        console.debug('Rummikub: addStopWatch to vars');
        // do nothing if varName is undefined
        if (isRUMEnabled && !impl.isBeaconFired && varName) {
            if (window.performance.now) {
                value = window.performance.now().toFixed(1);
                addVar(varName, value);
            } else {
                addVar(varName, 'undefined');
            }
        }
    }

    /**
     * Add Page NavigationTiming Metrics to impl.vars
     */
    function addNavTiming() {
        var performance,
            performanceTiming,
            nt_nav_st,
            nt_fetch_st,
            nt_dns_st,
            nt_dns_end,
            nt_con_st,
            nt_con_end,
            nt_req_st,
            nt_resp_st,
            nt_resp_end,
            nt_domcomp,
            nt_load_end,
            navTimingData;

        console.debug('Rummikub: addNavTiming to vars');

        performance = window.performance;

        // add NavigationTiming metrics to impl.vars
        if (performance && performance.timing) {
            console.debug('Rummikub: This user-agent supports NavigationTiming.');
            performanceTiming = performance.timing;
            nt_nav_st = performanceTiming.navigationStart;
            nt_fetch_st = performanceTiming.fetchStart;
            nt_dns_st = performanceTiming.domainLookupStart;
            nt_dns_end = performanceTiming.domainLookupEnd;
            nt_con_st = performanceTiming.connectStart;
            nt_con_end = performanceTiming.connectEnd;
            nt_req_st = performanceTiming.requestStart;
            nt_resp_st = performanceTiming.responseStart;
            nt_resp_end = performanceTiming.responseEnd;
            nt_domcomp = performanceTiming.domComplete;
            nt_load_end = performanceTiming.loadEventEnd;
            navTimingData = {
                t_ready: (nt_fetch_st - nt_nav_st),
                t_dns: (nt_dns_end - nt_dns_st),
                t_conn: (nt_con_end - nt_con_st),
                t_fistbyte: (nt_resp_st - nt_req_st),
                t_resp: (nt_resp_end - nt_resp_st),
                t_processing: (nt_domcomp - nt_resp_end),
                t_pageload: (nt_load_end - nt_domcomp)
            };
            addVar(navTimingData);
        } else {
            console.debug('Rummikub: This user-agent does not supports Navigation Timing API.');
        }
    }

    /**
     * Add Page URL to impl.vars
     */
    function addURL() {
        var tracked_url = window.location.href;

        console.debug('Rummikub: addURL to vars');
        if (tracked_url && tracked_url.length < 2000) {
            addVar('u', tracked_url);
        } else {
            console.warn('Rummikub: invalid url or url length is over 2k');
            addVar('u', 'invalidURL');
        }
    }

    /**
     * Send RUM beacon data after a specified number of time, 3000ms delay by default
     * @param {string} data the RUM Data with json format
     */
    function sendData(data) {
        var delayInMs = impl.beacon_delay_ms,
            ø = Object.create(null);

        console.debug('Rummikub: sendData Start');
        if (XMLHttpRequest) {
            setTimeout(sendReqByXHR.bind(ø, data), delayInMs);
        } else {
            console.warn('Rummikub: not able to make the request on current browser');
        }
    }

    /**
     * Prepare RUM Beacon request data, and check if it is already fired
     */
    function fireBeacon() {
        var perf_beacon = getAllVars();

        console.debug('Rummikub: fireBeacon() Start: ' + perf_beacon);
        if (!impl.isBeaconFired) {
            sendData(perf_beacon);

            impl.isBeaconFired = true;
        } else {
            console.warn('Rummikub: beacon already fired, ignore this...');
        }
    }

    /**
     * Prepare beacon variable and call fireBeacon() after a threshold
     * when page could not publish a 'app:render-ready' event, 15 sec by default
     */
    function onBeaconTimeout() {

        console.debug('Rummikub: onBeaconTimeout() Start');
        addVar('user_timing', window.performance.now().toFixed(1));
        addVar('timeout', 'true');
        addURL();

        fireBeacon();
    }

    /**
     * Schedule a TimeoutBeacon Task once page could not load on time, 15 sec by default
     */
    function scheduleTimeoutBeacon() {
        var t = impl.beaconTimeout_ms;

        console.debug('Rummikub: sendTimeoutBeacon() Start');
        if (t < 10000) {
            console.warn('Rummikub: beacon send timeout value is a little bit short...consider to increase it');
        }
        impl.timeoutID = setTimeout(onBeaconTimeout.bind(this), t);
        console.debug('Rummikub: TimeoutID Set: ' + impl.timeoutID);
    }

    /**
     * Event handler after publishing 'app:render-ready' event from page
     */
    function rumHandler() {

        console.info('Rummikub: app ready event is fired');
        try {
            cancelTimeoutBeacon(impl.timeoutID);

            addStopWatch('user_timing');

            addNavTiming();

            addURL();

            fireBeacon();
        } catch (ex) {
            console.warn('Rummikub: rumHandler exception ' + ex);
        }

    }

    /**
     * Listen to 'app:user-ready' event fired by the page if RUM feature enabled
     * meanwhile, schedule a timer to deal with timeout scenario
     */
    function initRummikub() {
        var eventName = 'app:user-ready';

        console.info('Rummikub: init Rummikub module');
        try {

            if (isRUMEnabled) {
                // TO-DO: use fooBunny framework to add lisetner
                console.log('Rummikub: listen to the event: ' + eventName);
                $("body").on(eventName, rumHandler);

                scheduleTimeoutBeacon();
            } else {
                console.info('Rummikub: RUM Feature is not enabled');
            }
        } catch (ex) {
            console.warn('Rummikub: initRummikub exception ' + ex);
        }
    }

    //initRummikub(); -- does not work, as body is not ready yet
    $(initRummikub); // wait for document ready

    // Reveal public functions and properties
    return {
        addStopWatch: addStopWatch,
        addCustomMetrics: addCustomMetrics
    };
})();
