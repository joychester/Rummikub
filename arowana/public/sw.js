//taste service work with resource timing API
var urls = [
  '/resources/bootstrap/js/bootstrap.min.js'
];
  
self.addEventListener("install", function(event) {

  urls = urls.map(function(url) {
    return new Request(url, {credentials: 'include'});
  });

  event.waitUntil(
    caches
      .open('v1')
      .then(function(cache) {
        // Fetch all the URL's and store in the cache
        return cache.addAll(urls);
      })
      .then(function () {
        // Analyse all the requests
        var requests = self.performance.getEntriesByType("resource");
        
        // Loop across all the requests and save the timing data.
        console.log(requests[0].responseStart);
        console.log(requests.length);
        return;
      })
  );
});

self.addEventListener('fetch',function(event){
 
      var fetched_url = event.request.url;
      console.log(fetched_url);
        // Loop across all the requests and save the timing data.
      if (fetched_url === 'https://tenseconds-joychester.c9users.io/resources/bootstrap/js/bootstrap.min.js') {
        var requests = self.performance.getEntriesByType("resource");
        console.log(requests[0].name + " = "+ requests[0].responseStart);
      }
  
});