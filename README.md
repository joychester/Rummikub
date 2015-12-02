# Rummikub
RUM solutions POC, using Custom metrics/Boomerang/BoomCatch/ServiceWorker:  

> * Add Custom metrics  
> * Add boomerang and plugins  
> * Minify Boomerang  
> * Install Boomcatch server  
> * Add service worker  

### Combine and Minify boomerang/plugin js with uglifyjs  
> * ~/workspace (master) $ git clone https://github.com/lognormal/boomerang.git  
> * ~/workspace/boomerang (master) $ npm install uglify-js -g  
> * ~/workspace/boomerang (master) $ make PLUGINS="plugins/rt.js" MINIFIER="uglifyjs -c -m"  

PS:add folder to repo as following  
```
git add --all arowana/  
```
