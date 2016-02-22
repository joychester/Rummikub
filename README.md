
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
5. BOOMR.sendBeacon(): Check all enabled plugins status ->  fire before_beacon() event to Add timers -> Add security var -> remove unwanted Vars -> fire onbeacon() event -> BOOMR.util.sendData()
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
        beacon_url: "/rest/beacon",
        autorun: false, <!-- If you set autorun to false, this will not happen and you will need to call BOOMR.page_ready() yourself.-->
        timeout: 15000,
        beacon_switch: "on", <!-- Turn on or off beacon-->
        page_filter: "" <!-- Define Regex to filter certain URLs-->
    });
```
*  **Step 4: Combine & minify all related script file:**

    We use [uglifyJS2] to compress annd minify our boomerang related js script.
```
  > * ~/workspace (master) $ npm install uglify-js -g  
  > * ~/workspace/Rummikub/arowana/public/resources/boomerang (master) $ make PLUGINS="rt.js boomer_init.js" MINIFIER="uglifyjs -c -m"
```
*  **Step 5: Asynchronously include the script on your page:**

    Include the following code at the top of your HTML document:
```
%script{:src => "/resources/boomerang/boomerang-<version>.js", :type => "text/javascript", :async => "async"}
```
*  **Step 6: instrument js code in a critical ajax call's success callback function:**

```
BOOMR.addVar("user_timing",window.performance.now().toFixed(1));
BOOMR.page_ready();
```
*  **Step 7: send beacon to Extrahop:**
*  **Step 8: Extrahop data process:**  

### Beacon Parameters
* **u**:  The URL of the page that sends the beacon.
* **t_done**: Perceived load time of the page.
* **t_page**: Time taken from the head of the page to page_ready.
* **t_other**: Comma separated list of additional timers set by page developer. Each timer is of the format name|value
* **_**: Hash String for security reason
* **timeout**: Timed out flag to indicate if really a timed out or missing probe  

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
