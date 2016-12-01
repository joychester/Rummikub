var app = angular.module('rum', []);

app.controller('RUMController', function ($scope, $http, $q) {
    $scope.changeNumber = function () {
        $http.get('/rest/angular').then(function (response) {
            if ($('#ajaxEle').length < 1) {
                var mdiv = document.getElementById("message_div");
                mdiv.innerHTML = response.data;
                if ("Rummikub" in window) {
                    //Rummikub.addStopWatch('user_timing');

                    //Add custom metrics Var if Resource timing API supported
                    Rummikub.addCustomMetrics('t_css', 'loginCSS done blocking');
                }
                //fire app:render-ready event
                var myEvent = jQuery.Event( 'app:user-ready' );
                $("body").trigger(myEvent);
            } else {
                $('#ajaxEle').text('Your Passcode Generated: ' + response.data);
            };
        });
    }
});


app.directive('myClick', function () {
    return {
        restrict: 'A',
        replace: false,
        link: function (scope, element, attr) {
            element.bind("click", function () {
                var funcName = attr.myClick.slice(0, -2);
                // the invoked function should return a promise. Otherwise, we don't know when the ajax call return. Promise.resolve() help us check the object type.
                scope[funcName]();
            });
        }
    }
});


function loadData() {
    var scope = angular.element($("#ctrl")).scope();
    scope.$apply(function () {
        // the invoked function should return a promise. Otherwise, we don't know when the ajax call return. Promise.resolve() help us check the object type.
        scope.changeNumber();
    })

}
