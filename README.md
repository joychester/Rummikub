
# Rummikub

### Intro
RUM solutions POC, using [Custom metrics]/Boomerang/BoomCatch/ServiceWorker. Demo site built with ruby sinatra frame work and AngularJS.

Real User Monitoring ([RUM]) is a passive monitoring technology that records all user interaction with a website or client interacting with a server or cloud-based application. The real user performance data like user-perceived page load time becomes more important because of the rapid growth of SPA. The traditional onload event provided by browsers no longer make sense in such application.

### Workflow
   ![Workflow](rum_workflow.png)  

### Key Steps
1. Init BOOMR: Set Properties in Config -> check beacon_Switch -> check Browser compatibility -> page filter -> Set timeout for beacon
2. Init Plugin: Subscribe event by binding event name to handler
3. Instrument code:
    Add BOOMR.addVar("user_timing",window.performance.now().toFixed(1));
    Call BOOMR.page_ready() to fire "page_ready" event
4. Trigger RT.done(): add timer to beacon -> Add Vars -> impl.complete=true -> BOOMR.sendBeacon()
5. BOOMR.sendBeacon(): Check all enabled plugins status ->  fire before_beacon() event to Add timers -> Add security var -> remove unwanted Vars -> fire onbeacon() event -> delay BOOMR.util.sendData() if beacon_delay > 0 -> Clear vars
6. disableTimeOut() in page_ready() method

### Installation

*  **Step 1: clone boomerang project from github:**

```
 > * ~/workspace (master) $ git clone https://github.com/lognormal/boomerang.git  
```
*  **Step 2: customize boomerang.js:**

    Diff original boomerang.js with ours to see the difference
*  **Step 3: create a boomer_init.js file:**

```
  BOOMR.init({
    //===boomerang original parameters===
    beacon_url: "/rest/beacon",//or "https:\/\/www.hostname.com\/rest\/beacon"
    autorun: false,

    //===customized parameters defined in BOOMR.init();===
    beacon_switch: "ON", //ignore case
    //Here we define a group of patterns, If one of them matched then the url will not be filtered.
    //The keyword "ALL" means all url will NOT be filtered
    //or define a Regex array: ["(^(http(s)?(:\/\/))?(www.)?)(domainname.(com|co.uk|de|fr))([-a-zA-Z0-9:%_+.~#?&//=]*)"],
    url_pattern: "all", //ignore case
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
```
*  **Step 4: Combine & minify all related script file:**

    We use [uglifyJS2] to compress annd minify our boomerang related js script.
```
  > * ~/workspace (master) $ npm install uglify-js -g  
  > * ~/workspace/Rummikub/arowana/public/resources/boomerang (master) $ make PLUGINS="rt.js boomer_init.js" MINIFIER="uglifyjs -c -m"
```
*  **Step 5: Asynchronously include the script on your page:**

    Include the following code at the top of your HAML document:
```
%script{:src => "/resources/boomerang/boomerang-<version>.js", :type => "text/javascript", :async => "async"}
```
    or defer loading all related js files for debug purpose:  
```
%script{:src => "/resources/boomerang/boomerang.js", :type => "text/javascript", :defer => ""}
%script{:src => "/resources/boomerang/rt.js", :type => "text/javascript", :defer => ""}
%script{:src => "/resources/boomerang/boomer_init.js", :type => "text/javascript", :defer => ""}
```

*  **Step 6: instrument js code in a critical ajax call's success callback function:**

```
//adding Boomerang variables before page_ready event triggered
if("BOOMR" in window && "performance" in window) {
  BOOMR.addVar("user_timing",window.performance.now().toFixed(1));

  //Add custom metrics Vars if Resource timing API supported
  //Safari and browsers on IOS which are using WKwebview do not support Resource Timing API: https://www.stevesouders.com/blog/2014/10/09/do-u-webview/  
  if(performance.getEntriesByName && performance.now){
      BOOMR.addVar("t_css", window.performance.getEntriesByName("stylesheets done blocking")[0].startTime.toFixed(1));
      BOOMR.addVar("t_js", window.performance.getEntriesByName("commonJS done blocking")[0].startTime.toFixed(1));
      BOOMR.addVar("t_heroimg_loaded",window.performance.getEntriesByName("hero img loaded")[0].startTime.toFixed(1));
      BOOMR.addVar('t_heroimg_onload',window.performance.getEntriesByName('hero img onload')[0].startTime.toFixed(1));
  }

  //Trigger Page_ready event to sendbeacon
  BOOMR.page_ready();
```
*  **Step 7: send beacon to Any Data Platform:**
*  **Step 8: Data platform generate real time dashboard:**  

### Beacon Parameters
* **u**:  The URL of the page that sends the beacon.
* **user_timing**:  The timing instrumented in your page indicate real user experience.
* **t_resp**: Time to First Byte.
* **t_done**: The same as user_timing, Perceived load time of the page.
* **t_page**: t_page = t_done - t_resp.  
* **t_other**: Comma separated list of additional timers set by page developer. Each timer is of the format name|value
* **_**: Hash String for security reason
* **timeout**: Timed out flag to indicate if really a timed out or missing probe  
* **t_css**: (Optional)Time to stylesheets done blocking, resource timing API support needed  
* **t_js**: (Optional)Time to scripts done blocking, resource timing API support needed  
* **t_heroimg_loaded**: (Optional)Time to Hero image (tag) loaded, resource timing API support needed  
* **t_heroimg_onload**: (Optional)Time to Hero image rendered, resource timing API support needed  

### Regex Sample:  
* Sample_1: http://www.domainname.com/  
[Regex](https://regex101.com/): /(^(http(s)?(:\/\/))?(www\.)?)(domainname.(com|co.uk|de|fr))([\/]?)$/gi

* Sample_2: http://www.domainname.com/abc-bcd-2016/event/999000/  
[Regex](https://regex101.com/): /(^(http(s)?(:\/\/))?(www\.)?)(domainname.(com|co.uk|de|fr))([\/]?)([-a-zA-Z0-9]\*)(\/event\/[0-9]{6,}[\/]?)$/gi

* Sample_3: http://www.domainname.com/abc-bcd-2016/event/999000/?id=11838186865&cb=1  
[Regex](https://regex101.com/): /(^(http(s)?(:\/\/))?(www\.)?)(domainname.(com|co.uk|de|fr))([\/]?)([-a-zA-Z0-9]\*)(\/event\/[0-9]{6,}[\/]?)([-a-zA-Z0-9:%\_\+.~#?&//=]\*)$/gi

* Sample_4: All Match  
[Regex](https://regex101.com/): /(^(http(s)?(:\/\/))?(www\.)?)(domainname.(com|co.uk|de|fr))([-a-zA-Z0-9:%\_\+.~#?&//=]\*)/gi

[Boomerang.js]: https://github.com/lognormal/boomerang/blob/master/boomerang.js
[plugins]: https://github.com/lognormal/boomerang/tree/master/plugins
[uglifyJS2]: https://github.com/mishoo/UglifyJS2
[Custom metrics]: https://speedcurve.com/blog/user-timing-and-custom-metrics/
[RUM]: https://en.wikipedia.org/wiki/Real_user_monitoring
