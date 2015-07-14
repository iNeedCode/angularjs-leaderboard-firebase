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
        .state('image', {
            url: '/image',
            templateUrl: 'templates/image.html'
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

app.controller('ImageUpload', ['$scope', '$log',
    function ImageUpload($scope, $log, FIREBASE_URI) {
        $scope.upload_image = function (image) {
            if (!image.valid) return;

            var imagesRef, safename, imageUpload;

            image.isUploading = true;
            imageUpload = {
                isUploading: true,
                data: image.data,
                //thumbnail: image.thumbnail,
                name: image.filename
                //,
                //author: {
                //    provider: $scope.auth.user.provider,
                //    id: $scope.auth.user.id
                //}
            };

            safename = imageUpload.name.replace(/\.|\#|\$|\[|\]|-|\//g, "");
            imagesRef = new Firebase('https://shining-torch-1269.firebaseio.com' + '/images');

            imagesRef.child(safename).set(imageUpload, function (err) {
                if (!err) {
                    imagesRef.child(safename).child('isUploading').remove();
                    $scope.$apply(function () {
                        $scope.status = 'Your image "' + image.filename + '" has been successfully uploaded!';
                        if ($scope.uploaded_callback !== undefined) {
                            $scope.uploaded_callback(angular.copy(imageUpload));
                        }
                        image.isUploading = false;
                        image.data = undefined;
                        image.filename = undefined;
                    });
                }else{
                    $scope.error = 'There was an error while uploading your image: ' + err;
                }
            });
        };
    }
]);

app.directive('fbImageUpload', [function() {
    return {
        link: function(scope, element, attrs) {
            // Modified from https://developer.mozilla.org/en-US/docs/Web/API/FileReader
            var fileReader = new FileReader();
            var fileFilter = /^(?:image\/bmp|image\/cis\-cod|image\/gif|image\/ief|image\/jpeg|image\/jpeg|image\/jpeg|image\/pipeg|image\/png|image\/svg\+xml|image\/tiff|image\/x\-cmu\-raster|image\/x\-cmx|image\/x\-icon|image\/x\-portable\-anymap|image\/x\-portable\-bitmap|image\/x\-portable\-graymap|image\/x\-portable\-pixmap|image\/x\-rgb|image\/x\-xbitmap|image\/x\-xpixmap|image\/x\-xwindowdump)$/i;
            var wasUploading = false;

            scope.image = {valid: false};

            scope.$watch('image.isUploading', function () {
                var isUploading = scope.image.isUploading;
                if (isUploading && !wasUploading) {
                    wasUploading = true;
                }else if (!isUploading && wasUploading) {
                    wasUploading = false;
                    element.parent().parent()[0].reset();
                }
            });

            fileReader.onload = function (fileReaderEvent) {
                scope.$apply(function () {
                    scope.image.data = fileReaderEvent.target.result;
                });
            };

            var load_image = function(imageInput) {
                if (imageInput.files.length === 0) {
                    return;
                }

                var file = imageInput.files[0];

                scope.image.filename = file.name;

                if (!fileFilter.test(file.type)) {
                    scope.error = 'You must select a valid image!';
                    scope.image.valid = false;
                    scope.$apply();
                    return;
                }else{
                    scope.error = '';
                    scope.image.valid = true;
                }

                fileReader.readAsDataURL(file);
                scope.$apply();
            };

            element[0].onchange = function() {
                load_image(element[0]);
            };
        },
        restrict: 'A'
    };
}]);

app.directive('fbSrc', ['$log', function ($log) {
    // Used to embed images stored in Firebase

    /*
     Required attributes:
     fp-src (The name of an image stored in Firebase)
     */
    return {
        link: function (scope, elem, attrs) {
            var safename = attrs.fpSrc.replace(/\.|\#|\$|\[|\]|-|\//g, "");
            var dataRef = new Firebase( [scope.firebaseUrl, 'images', safename].join('/') );
            elem.attr('alt', attrs.fpSrc);
            dataRef.once('value', function (snapshot) {
                var image = snapshot.val();
                if (!image) {
                    $log.log('It appears the image ' + attrs.fpSrc + ' does not exist.');
                }else{
                    elem.attr('src', image.data);
                }
            });
        },
        restrict: 'A'
    };
}]);