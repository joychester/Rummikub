BOOMR.init({
    beacon_url: "/rest/beacon",
    autorun: false,
    timeout: 15000,
    beacon_switch: "ON", //ignore case
    page_filter: "(^(http(s)?(:\/\/))?(www.)?)(slcd000ldr003.(com|co.uk|de|fr|c9users.io|stubcorp.com))([\/]?)",
    RT: {} //optional plugin config
});
