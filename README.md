
# Rummikub

### Intro
RUM solutions POC, using Custom metrics/Boomerang/BoomCatch/ServiceWorker. Demo site built with ruby sinatra frame work and AngularJS. 

Real User Monitoring (RUM) is a passive monitoring technology that records all user interaction with a website or client interacting with a server or cloud-based application. The real user performance data like user-perceived page load time becomes more important because of the rapid growth of SPA. The traditional onload event provided by browsers no longer make sense in such application.

### Install
* install ruby and make sure the version is consistent with the version configured in gemfile.
* config boomerang in boomer.js file:
* minify boomerang configure into a minify file boomerang.min.js
* launch server by command
  ```rackup config.ru```

### Design
* Custom metrics in critical position like CSS load, JS load and hero image load.
* Customize boomerang, remove variables we don't need
* Count percevied page load time in a critical ajax call's callback function
* Send RUM data to data host via Boomerang

### Boomrang Change
* Add a sendData() function without checking plugins' state 
* Remove listening to the "page_ready" event in RT plugin
* Add a variable filters with whitelist to remove variables we don't need.

### TO DO List
* Confirm the beacon uri.
* Security.  Make sure data host can identify and accept the beacon request from a real user not a hacker.
* Data analysis


### Others
##### Combine and Minify boomerang/plugin js with uglifyjs  
> * ~/workspace (master) $ git clone https://github.com/lognormal/boomerang.git  
> * ~/workspace/boomerang (master) $ npm install uglify-js -g  
> * ~/workspace/boomerang (master) $ make PLUGINS="plugins/rt.js" MINIFIER="uglifyjs -c -m"  


##### folder to repo as following  
```
git add --all arowana/  
```

