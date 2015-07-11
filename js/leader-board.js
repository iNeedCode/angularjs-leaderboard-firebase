var app = angular.module('leaderboard', ['firebase', 'ui.router']);


angular.module('services', [])
    .factory('state', function () {
        'use strict';

        var state = {};

        return {
            state: state
        };
    });

app.config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/');

    $stateProvider
        .state('main', {
            url: '/',
            templateUrl: 'templates/main.html'
        })
        .state('admin', {
            url: '/admin',
            templateUrl: 'templates/admin.html'
        })
        .state('remote', {
            url: '/remote',
            templateUrl: 'templates/remote.html'
        })
        .state('auth', {
            url: '/auth',
            templateUrl: 'templates/auth.html'
        })
});

app.constant('FIREBASE_URI', 'shining-torch-1269.firebaseio.com');

app.factory('state', function ($rootScope) {
    'use strict';

    var state;

    var broadcast = function (state) {
        $rootScope.$broadcast('state.update', state);
    };

    var update = function (newState) {
        state = newState;
        broadcast(state);
    };

    return {
        update: update,
        state: state
    };
});

app.controller('MainCtrl', function (ContestantsService, $rootScope) {
    var main = this;
    main.newContestant = {lane: '', name: '', score: ''};
    main.currentContestant = null;
    main.contestants = ContestantsService.getContestants();
    //console.log(main.contestants)

    main.addContestant = function () {
        ContestantsService.addContestant(angular.copy(main.newContestant));
        main.newContestant = {lane: '', name: '', score: ''};
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
});

app.service('ContestantsService', function ($firebaseArray, FIREBASE_URI) {
    var service = this;
    var ref = new Firebase(FIREBASE_URI);
    var contestants = $firebaseArray(ref);

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


app.controller('AuthCtrl', ['$scope', '$location', '$firebase',
    function ($scope, $location, $firebase, $rootScope) {

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
                    console.log(authData);
                }
            }, {
                remember: "sessionOnly"
            });
        };
    }]);
