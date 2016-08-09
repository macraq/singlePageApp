(function (angular) {

    "use strict";

    console.clear();

    angular
        .module("Test", ["ngRoute"])

        .config(function ($routeProvider) {
            $routeProvider
                .when("/", {
                    templateUrl: "public",
                    controller: "BaseController",
                    controllerAs: "context"
                })
                .when("/login", {
                    templateUrl: "login",
                    controller: "LoginController",
                    controllerAs: "context"
                })
                .when("/private", {
                    templateUrl: "private",
                    controller: "BaseController",
                    controllerAs: "context",
                    authorize: true
                })
                .when("/private/page/{pageId:int}", {
                    templateUrl: "private_page",
                    controller: 'PrivatePageContrller',
                    controllerAs: "context",
                    authorize: true
                })
                .otherwise({
                    redirectTo: "/"
                });
        })

        .run(function ($rootScope, $location, $window) {
            function getPath(route) {
                if (!!route && typeof (route.originalPath) === "string")
                    return "'" + route.originalPath + "'";
                return "[unknown route, using otherwise]";
            }

            $rootScope.$on("$routeChangeStart", function (evt, to, from) {
                console.log("Route change start from", getPath(from), "to", getPath(to));
                if (to.authorize === true) {
                    to.resolve = to.resolve || {};
                    if (!to.resolve.authorizationResolver) {
                        to.resolve.authorizationResolver = function (authService) {
                            console.log("Resolving authorization.");
                            return authService.authorize();
                        };
                    }
                }
            });

            $rootScope.$on("$routeChangeError", function (evt, to, from, error) {
                console.log("Route change ERROR from", getPath(from), "to", getPath(to), error);
                if (error instanceof AuthorizationError) {
                    $location.path("/login").search("returnTo", to.originalPath);
                }
            });
            $rootScope.$on("$routeChangeSuccess", function (evt, to, from) {
                console.log("Route change success from", getPath(from), "to", getPath(to));
            });
        })

        .controller("LoginController", function ($location, authService) {
            console.log("Instantiating login controller");
            this.login = login(true, $location.search().returnTo);
            this.logout = login(false, "/");
            function login(doWhat, whereTo) {
                return function () {
                    console.log("Authentication set to", doWhat, "Redirecting to", whereTo);
                    authService.authenticated = doWhat;
                    $location.path(whereTo && whereTo || "/");
                };
            }
        })

        .controller("PrivatePageContrller", function($scope, $routeParams){
            console.log("Instantiating fund controller");
            $scope.pageId = $routeParams.pageId;
            
        })

        .controller("BaseController", function ($scope) {
            console.log("Instantiating base controller");
            $scope.console = console;
        })

        .service("authService", function ($q, $timeout) {
            console.log("Instantiating auth service");
            var self = this;
            this.authenticated = false;
            this.authorize = function () {
                return this
                    .getInfo()
                    .then(function (info) {
                        console.log("Checking authentication status", info);
                        if (info.authenticated === true) {
                            return true;
                        }
                        throw new AuthorizationError();
                    });
            };
            this.getInfo = function () {
                console.log("Acquiring authentication info");
                return $timeout(function () {
                    console.log("Authorization info acquired");
                    return self;
                }, 1000);
            };
        });

    function AuthorizationError(description) {
        this.message = "Forbidden";
        this.description = description || "User authentication required.";
    }

    AuthorizationError.prototype = Object.create(Error.prototype);
    AuthorizationError.prototype.constructor = AuthorizationError;

})(angular);