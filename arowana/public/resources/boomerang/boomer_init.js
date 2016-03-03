BOOMR.init({
    beacon_url: "/rest/beacon",
    autorun: false,
    timeout: 15000,
    beacon_delay: 0, // in ms
    beacon_switch: "ON", //ignore case
    blacklist: [
                "rt.start","rt.tstart","rt.bstart","rt.end","r","vis.st","vis.lh" //rt plugin 
                //other plugins
                ], 
    page_filter: "(^(http(s)?(:\/\/))?(www.)?)(rummikub-fredxue.(com|co.uk|de|fr|c9users.io))([\/]?)",
    RT: {} //optional plugin config
});
