var app = angular.module('rum',[]);

app.controller('RUMController',function($scope, $http, $q){
   $scope.changeNumber = function(){
        $http.get('/rest/angular').then(function(response) {
             if($('#ajaxEle').length<1) {
                var mdiv=document.getElementById("message_div");
                mdiv.innerHTML=response.data;
                //adding Boomerang variables before page_ready event triggered
                if("BOOMR" in window && "performance" in window) {
                  BOOMR.addVar('user_timing',window.performance.now().toFixed(1));

                  //Add custom metrics Var if Resource timing API supported
                  shBoomrExt.addUMVar('t_css', 'loginCSS done blocking');
                  shBoomrExt.addUMVar('t_js', 'loginJS done blocking');
                  shBoomrExt.addUMVar('t_heroimg_loaded', 'hero img loaded');
                  shBoomrExt.addUMVar('t_heroimg_onload', 'hero img onload');

                  //Trigger Page_ready event to send beacon
                  BOOMR.page_ready();
                }
             } else {
                 $('#ajaxEle').text('Your Passcode Generated: '+response.data);
             };
        });
   }

});


app.directive('myClick',function(){
    return {
        restrict: 'A',
        replace: false,
        link: function(scope,element,attr){
            element.bind("click", function(){
                var funcName = attr.myClick.slice(0,-2);
                // window.performance.clearMarks();
                // window.performance.clearMeasures();
                // window.performance.mark(funcName+"Start");
                // the invoked function should return a promise. Otherwise, we don't know when the ajax call return. Promise.resolve() help us check the object type.
               scope[funcName]();
                //   window.performance.mark(funcName+"End");
                //   window.performance.measure(funcName,funcName+"Start",funcName+"End");
                //   console.log(window.performance.getEntriesByType('measure'));
                //   BOOMR.sendMyData(funcName,window.performance.getEntriesByName(funcName)[0].duration.toFixed(1));
            });
        }
    }
});


function loadData(){
    var scope = angular.element($("#ctrl")).scope();
    scope.$apply(function(){
        // window.performance.clearMarks();
        // window.performance.clearMeasures();
        // the invoked function should return a promise. Otherwise, we don't know when the ajax call return. Promise.resolve() help us check the object type.
        scope.changeNumber();
        //   window.performance.mark("ajax3");
        //   window.performance.measure("ajax3","navigationStart","ajax3");
        //   console.log(window.performance.getEntriesByType('measure')); splunk
    })

}
