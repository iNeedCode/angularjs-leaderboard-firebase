var app = angular.module('leaderboard', ['firebase', 'ui.router']);


app.config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/');

    $stateProvider
        .state('main', {
            url: '/',
            templateUrl: 'templates/main.html'
        })
        .state('admin', {
            url: '/admin',
            templateUrl: 'templates/admin.html',
            resolve: {
                data: function (Auth, $location) {
                    if (Auth.isLoggedIn() == false) {
                        $location.patch("/").replace();
                    }
                }
            }
        })
        .state('remote', {
            url: '/remote',
            templateUrl: 'templates/remote.html',
            resolve: {
                data: function (Auth, $location) {
                    if (Auth.isLoggedIn() == false) {
                        $location.patch("/").replace();
                    }
                }
            }
        })
        .state('auth', {
            url: '/auth',
            templateUrl: 'templates/auth.html'
        })
});

app.constant('FIREBASE_URI', 'shining-torch-1269.firebaseio.com');

app.factory('Auth', function () {
    var user;

    return {
        setUser: function (aUser) {
            user = aUser;
        },
        isLoggedIn: function () {
            return (user) ? user : false;
        }
    }
});

app.controller('MainCtrl', ['$scope', 'Auth', '$location', 'ContestantsService', function ($scope, Auth, $location, ContestantsService) {
    var main = this;
    main.newContestant = {zone: '', name: '', score: ''};
    main.currentContestant = null;
    main.contestants = ContestantsService.getContestants();
    main.logged_in = false;

    main.addContestant = function () {
        ContestantsService.addContestant(angular.copy(main.newContestant));
        main.newContestant = {zone: '', name: '', score: ''};
    };

    main.updateContestant = function (contestant) {
        ContestantsService.updateContestant(contestant);
    };

    main.removeContestant = function (contestant) {
        ContestantsService.removeContestant(contestant);
    };

    main.incrementScore = function () {
        main.currentContestant.score = parseInt(main.currentContestant.score, 10) + 1;
        main.updateContestant(main.currentContestant);
    };

    main.decrementScore = function () {
        main.currentContestant.score = parseInt(main.currentContestant.score, 10) - 1;
        main.updateContestant(main.currentContestant);
    };

    //Auth
    $scope.$watch(Auth.isLoggedIn, function (value, oldValue) {

        if (!value && oldValue) {
            console.log("Disconnect");
            $location.path('/auth');
            main.logged_in = false;
        }

        if (value) {
            console.log("Connect");
            main.logged_in = true;
        }
    }, true);
}]);

app.filter('reverse', function() {
    return function(items) {
        return items.slice().reverse();
    };
});

app.service('ContestantsService', function ($firebaseArray, FIREBASE_URI) {
    var service = this;
    var ref = new Firebase(FIREBASE_URI);
    var query = ref.orderByChild('score').limitToLast(10);

    var contestants = $firebaseArray(query);

    service.getContestants = function () {
        return contestants;
    };

    service.addContestant = function (contestant) {
        contestants.$add(contestant);
    };

    service.updateContestant = function (contestant) {
        contestants.$save(contestant);
    };

    service.removeContestant = function (contestant) {
        contestants.$remove(contestant);
    };
});


app.controller('AuthCtrl', ['$scope', '$location', '$firebase', 'Auth',
    function ($scope, $location, $firebase, Auth) {
        $scope.message = "";
        var email = "";
        var password = "";

        var ref = new Firebase("https://shining-torch-1269.firebaseio.com/");
        $scope.signIn = function () {

            email = $scope.email;
            password = $scope.password;

            ref.authWithPassword({
                email: email,
                password: password
            }, function (error, authData) {
                if (error) {
                    switch (error.code) {
                        case "INVALID_EMAIL":
                            alert("The specified user account email is invalid.");
                            break;
                        case "INVALID_PASSWORD":
                            alert("The specified user account password is incorrect.");
                            break;
                        case "INVALID_USER":
                            alert("The specified user account does not exist.");
                            break;
                        default:
                            alert("Error logging user in:", error)
                    }
                    $scope.message = "Wrong Username/Password;";
                } else {
                    $location.path("/admin");
                    Auth.setUser(authData);
                    //console.log("Auth user:");
                    //console.log(Auth.isLoggedIn());
                }
            }, {
                remember: "sessionOnly"
            });
        };
    }]);
