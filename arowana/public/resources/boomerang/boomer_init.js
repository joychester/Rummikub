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
    //Here we define a group of patterns, If one of them matched then the url will not be filtered.
    //The keyword "ALL" means all url will NOT be filtered!!!
    url_pattern: ["sdfasdfsdfs","(^(http(s)?(:\/\/))?(www.)?)(rummikub-fredxue.(com|co.uk|de|fr|c9users.io))([\/]?)","ALL"], 
    RT: {} //optional plugin config
});
