var app = angular.module('rum',[]);

app.controller('RUMController',function($scope, $http){
   $scope.changeNumber = function(){
      return $http.get('/rest/angular').success(function(data){
                                     if($('#ajaxEle').length<1) {
                                         $('.welcome').append(' <p id="ajaxEle">This is a very very mad world: '+data+'</p>');
                                     }else{
                                         $('#ajaxEle').text('This is a very very mad world: '+data);
                                     }
                                     }
    );
   }
});


app.directive('myClick',function(){
    return {
        restrict: 'A',
        replace: false,
        link: function(scope,element,attr){
           
            element.bind("click", function(){
                 console.log("Ready to fire:" + window.performance.now());
                var funcName = attr.myClick.slice(0,-2);
                window.performance.clearMarks();
                window.performance.clearMeasures();
                window.performance.mark(funcName+"Start");
                // the invoked function should return a promise. Otherwise, we don't know when the ajax call return. Promise.resolve() help us check the object type.
                Promise.resolve(scope[funcName]()).then(function(){
                   window.performance.mark(funcName+"End");
                   window.performance.measure(funcName,funcName+"Start",funcName+"End");
                   console.log(window.performance.getEntriesByType('measure'));
                   BOOMR.sendMyData(funcName,window.performance.getEntriesByName(funcName)[0].duration.toFixed(1));
                 });
            });
        }
    }
    

});


function loadData(){
    var scope = angular.element($("#ctrl")).scope();
    scope.$apply(function(){
        console.log("Ready to fire:" + window.performance.now());
        window.performance.clearMarks();
        window.performance.clearMeasures();
        // the invoked function should return a promise. Otherwise, we don't know when the ajax call return. Promise.resolve() help us check the object type.
        Promise.resolve(scope.changeNumber()).then(function(){
          window.performance.mark("page_ready");
          window.performance.measure("page_ready","navigationStart","page_ready");
        //   console.log(window.performance.getEntriesByType('measure'));
          BOOMR.addVar("user_timing",window.performance.getEntriesByName("page_ready")[0].duration.toFixed(1));
          BOOMR.page_ready();
        });

    })

}