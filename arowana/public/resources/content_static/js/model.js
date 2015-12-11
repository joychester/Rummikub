var app = angular.module('rum',[]);
// var count =0;

app.controller('RUMController',function($scope, $http){
   $scope.changeNumber = function(){
      return $http.get('/rest/angular').success(function(data){
                                      $scope.random = data;
                                     }
    );
   }
  
});


app.directive('myClick',function(){
    return {
        restrict: 'A',
        replace: false,
        link: function(scope,element,attr){
            element.bind("click",function(){
            var funcName = attr.myClick.slice(0,-2);
            window.performance.clearMarks();
            window.performance.clearMeasures();
            window.performance.mark(funcName+"Start");
            var timer = BOOMR.requestStart("my-timer");
            // the invoked function should return a promise. Otherwise, we don't know when the ajax call return. Promise.resolve() help us check the object type.
            Promise.resolve(scope[funcName]()).then(function(){
               window.performance.mark(funcName+"End");
               window.performance.measure(funcName,funcName+"Start",funcName+"End");
               console.log(window.performance.getEntriesByType('measure'));
            //   BOOMR.plugins.RT.done();
       
            //   BOOMR.plugins.RT.setTimer(funcName, window.performance.getEntriesByName(funcName)[0].duration);
               if(timer) timer.loaded();
            });
          });
        }
    }
});