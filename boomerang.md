# Boomerang

boomerang is a piece of javascript that you add to your web pages, where it measures the performance of your website from your end user's point of view

### Critical Object 
- [boomr]     
    >We create a boomr object and then copy all its properties to BOOMR so that
we don't overwrite anything additional that was added to BOOMR before this was called... for example, a plugin"

    - **init**,
        * check domain
        * config impl object if exists
        * init plugins in order
        * add listener to page load event and fire the BOOMR.page_ready function if property autorun is true
    - **page_ready**, fired when page is usable. The developer can define when is the page is usable by themselves, only call this if autorun is explicitly set to false.
        * fire the event handler
    - setImmediate, provide all kind of browsers's compatibility
    - now
    - **subscribe**, add a custome event handler to a specific event
    - addError
    - addVar
    - removeVar
    - requestStart
    - responseEnd
    - **sendBeacon**,
        * check  whether all plugins are ready
        * check visibility
        * fire before_beacon event
        * create a hidden form
        * send data with this form
- impl
    >impl is a private object not reachable from outside the BOOMR object users can set properties by passing in to the init() method

    - beacon_url
    - **onloadfired**: a flag to mark whether the page is load
    - **events**
    - public_events
    - **vars**: beacon vars
    - xb_handler
    - **fireEvent**: execute event handle via e_name and data
      
- [utils]
    >Some utility functions
    
    - **objectToString**,   Print an object in String, passed in seperator and nest level
    - **getCookie**, get Cookie by name from document object
    - **setCookie**, set Cookie's content and max_age 
    - **getSubCookie**, get subcoolies from a String and return an object
    - removeCookie
    - **hashQueryString**, 
    - **pluginConfig**, config plugins with somw properties
    - addObserver, add Mutation observer
    - addListener
    - **sendData**, send data array with a hidden form and a specific http method

### Critical Event
- page_ready
    >Fired when the page is usable by the user. By default this is fired when window.onload fires, but if you set autorun to false when calling BOOMR.init(), then you must explicitly fire this event by calling BOOMR.page_ready().
- page_unload
    >Fired just before the browser unloads the page. This is fired when window.onbeforeunload fires (onunload on Opera).
- visibility_changed
    >Fired if the page's visibility state changes. Currently only supported on IE10 and Chrome.
- before_beacon
    >Fired just before the beacon is sent to the server. You can stop the beacon from firing by calling BOOMR.removeVar() for all beacon parameters.
 
### Preprocess 
  - Check domain
  - dispatch custome event (CustomEvent proxy for IE)





[//]: # (These are reference links used in the body of this note and get stripped out when the markdown processor does its job. There is no need to format nicely because it shouldn't be seen. Thanks SO - http://stackoverflow.com/questions/4823468/store-comments-in-markdown-syntax)

   [utils]: http://www.lognormal.com/boomerang/doc/api/BOOMR.utils.html
   [boomr]: http://www.lognormal.com/boomerang/doc/api/BOOMR.html
  


