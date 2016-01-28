
# Rummikub

### Intro
RUM solutions POC, using [Custom metrics]/Boomerang/BoomCatch/ServiceWorker. Demo site built with ruby sinatra frame work and AngularJS. 

Real User Monitoring ([RUM]) is a passive monitoring technology that records all user interaction with a website or client interacting with a server or cloud-based application. The real user performance data like user-perceived page load time becomes more important because of the rapid growth of SPA. The traditional onload event provided by browsers no longer make sense in such application.

### Workflow
   ![Workflow](rum_workflow.png)
   
### Installation

*  **Step 1: clone boomerang project from github:** 

```
 > * ~/workspace (master) $ git clone https://github.com/lognormal/boomerang.git  
```
*  **Step 2: customize boomerang.js:**

    Detailed boomerang change see below.
*  **Step 3: create a boomer_init.js file:**

```
    BOOMR.init({
        beacon_url: "/rest/beacon",
        autorun: false, <!-- If you set autorun to false, this will not happen and you will need to call BOOMR.page_ready() yourself.-->
        timeout: 10000, 
        beacon_switch: true <!-- Turn on or off beacon-->
    });
```
*  **Step 4: Combine & minify all related script file:**
    
    We use [uglifyJS2] to compress annd minify our boomerang related js script.
```
  > * ~/workspace/boomerang (master) $ npm install uglify-js -g  
  > * ~/workspace/boomerang (master) $ make PLUGINS="plugins/rt.js boomer_init.js" MINIFIER="uglifyjs -c -m"  
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


### Boomrang Change
* Add a sendData() function without checking plugins' state 
* Remove listening to the "page_ready" event in RT plugin to avoid sending a request when page unload particular happened in Chrome
* Add a variable filters with whitelist to remove variables we don't need.
* Add a beacon_switch parameter to turn on/off send beacon
* Add a timeout mechanism 
* Add a security machanism with adding a encoded string in beacon request.

### Beacon Parameter
* **u**:  The URL of the page that sends the beacon.
* **t_done**: Perceived load time of the page.
* **t_page**: Time taken from the head of the page to page_ready.
* **t_other**: Comma separated list of additional timers set by page developer. Each timer is of the format name|value
* **_**: Hash String for security reason
* **timeout**: Timed out flag to indicate if really a timed out or missing probe

### TODOs
* Flag or Regex config for specific page
* No ajax call included, better not to send timeout beacon
* When ajaxcall enter error callback function, better not to send timeout beacon.
* Data analysis

   [Boomerang.js]: https://github.com/lognormal/boomerang/blob/master/boomerang.js
   [plugins]: https://github.com/lognormal/boomerang/tree/master/plugins
   [uglifyJS2]: https://github.com/mishoo/UglifyJS2
   [Custom metrics]: https://speedcurve.com/blog/user-timing-and-custom-metrics/
   [RUM]: https://en.wikipedia.org/wiki/Real_user_monitoring
