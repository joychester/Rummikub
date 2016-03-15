var app = angular.module('rum',[]);

app.controller('RUMController',function($scope, $http, $q){
   $scope.changeNumber = function(){
        $http.get('/rest/angular').then(function(response) {
             if($('#ajaxEle').length<1) {
                 $('.welcome').append(' <p id="ajaxEle">This is a very very mad world: '+response.data+'</p>');
                     BOOMR.addVar("user_timing",window.performance.now().toFixed(1));
                     BOOMR.page_ready();
             }else{
                 $('#ajaxEle').text('This is a very very mad world: '+response.data);
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