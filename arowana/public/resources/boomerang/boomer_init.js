BOOMR.init({
    //===boomerang original parameters===
    beacon_url: "/rest/beacon",//or "https:\/\/www.hostname.com\/rest\/beacon"
    autorun: false,

    //===customized parameters defined in BOOMR.init();===
    beacon_switch: "ON", //ignore case
    //Here we define a group of patterns, If one of them matched then the url will not be filtered.
    //The keyword "ALL" means all url will NOT be filtered, ignore case
    //or define a Regex array: ["(^(http(s)?(:\/\/))?(www.)?)(domainname.(com|co.uk|de|fr))([-a-zA-Z0-9:%_+.~#?&//=]*)"]
    url_pattern: ["(.*\/login$)", "(.*\/home$)"],
    timeout: 15000,

    //===customized parameters defined in BOOMR.sendData();===
    blacklist: [
                "v",// Boomerang parameters
                "rt.start","rt.tstart","rt.bstart","rt.end","r","vis.st","vis.lh","r2" //roundtrip plugin parameters
                //other plugins parameters
                ],
    beacon_delay: 0, // in ms

    //===optional plugin configs===
    RT: {}
});
