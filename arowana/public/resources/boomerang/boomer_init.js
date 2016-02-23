BOOMR.init({
    beacon_url: "/rest/beacon",
    autorun: false,
    timeout: 15000,
    beacon_delay: 0,
    beacon_switch: "ON", //ignore case
    page_filter: "(^(http(s)?(:\/\/))?(www.)?)(rummikub-fredxue.(com|co.uk|de|fr|c9users.io))([\/]?)",
    RT: {} //optional plugin config
});
