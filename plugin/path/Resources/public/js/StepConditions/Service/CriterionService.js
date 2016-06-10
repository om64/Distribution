/**
 * Criterion Service
 * Loads data for resolving Step condition criteria
 *
 * @param {Object} $http
 * @param {Object} $q
 * @param {PathService} PathService
 *
 * @constructor
 */
var CriterionService = function CriterionService($http, $q, PathService) {
    this.$http = $http;
    this.$q = $q;
    this.PathService = PathService;
};

// Set up dependency injection
CriterionService.$inject = [
    '$http',
    '$q',
    'PathService'
];

/**
 * Groups available in the platform
 * @type {Array}
 */
CriterionService.prototype.groups = null;

/**
 * Groups of the current User
 * @type {Array}
 */
CriterionService.prototype.userGroups = null;

/**
 * Teams available in the Path workspace
 * @type {Array}
 */
CriterionService.prototype.teams = null;

/**
 * Teams of the current User
 * @type {Array}
 */
CriterionService.prototype.userTeams = null;

/**
 * Statuses available for an Activity
 * @type {Array}
 */
CriterionService.prototype.activityStatuses = null;

/**
 * Evaluations for the Activities of the Path
 * @type {Array}
 */
CriterionService.prototype.evaluations = null;

/**
 * Get the list of available Groups
 *
 * @returns {promise}
 */
CriterionService.prototype.getGroups = function getGroups() {
    var deferred = this.$q.defer();

    if (null === this.groups) {
        this.$http
            .get(Routing.generate('innova_path_criteria_groups'))
            .success(function (response){
                this.groups = response;

                deferred.resolve(this.groups);
            }.bind(this));
    } else {
        deferred.resolve(this.groups);
    }

    return deferred.promise;
};

/**
 * Get the list of current User groups
 * @returns {promise}
 */
CriterionService.prototype.getUserGroups = function getUserGroups() {
    var deferred = this.$q.defer();

    if (null === this.userGroups) {
        this.$http
            .get(Routing.generate('innova_path_criteria_user_groups'))
            .success(function (response) {
                this.userGroups = response;

                deferred.resolve(this.userGroups);
            }.bind(this));
    } else {
        deferred.resolve(this.userGroups);
    }

    return deferred.promise;
};

/**
 * Get the list of available teams in the Workspace of the current Path
 * @returns {promise}
 */
CriterionService.prototype.getTeams = function getTeams() {
    var path = this.PathService.getPath();

    var deferred = this.$q.defer();

    if (null === this.teams) {
        this.$http
            .get(Routing.generate('innova_path_criteria_teams', { id: path.id }))
            .success(function (response) {
                // Store received data
                this.teams = response;

                // Resolve the Promise
                deferred.resolve(this.teams);
            }.bind(this));
    } else {
        deferred.resolve(this.teams);
    }

    return deferred.promise;
};

/**
 * Get the list of current User teams
 * @returns {promise}
 */
CriterionService.prototype.getUserTeams = function getUserTeams() {
    var deferred = this.$q.defer();

    if (null === this.userTeams) {
        this.$http
            .get(Routing.generate('innova_path_criteria_user_teams'))
            .success(function (response) {
                this.userTeams = response;

                deferred.resolve(this.userTeams);
            }.bind(this));
    } else {
        deferred.resolve(this.userTeams);
    }

    return deferred.promise;
};

/**
 * Gat the list of statuses available for an Activity
 * @type {Array}
 */
CriterionService.prototype.getActivityStatuses = function getActivityStatuses() {
    var deferred = this.$q.defer();

    if (null === this.activityStatuses) {
        this.$http
            .get(Routing.generate('innova_path_criteria_activity_statuses'))
            .success(function (response) {
                this.activityStatuses = response;

                deferred.resolve(this.activityStatuses);
            }.bind(this));
    } else {
        deferred.resolve(this.activityStatuses);
    }

    return deferred.promise;
};

/**
 * Retrieve all evaluation for a path
 */
CriterionService.prototype.getEvaluations = function getEvaluations() {
    var path = this.PathService.getPath();

    var deferred = this.$q.defer();

    if (null === this.evaluations) {
        this.$http
            .get(Routing.generate('innova_path_evaluation', { id: path.id }))
            .success(function (response) {
                this.evaluations = response;

                // Resolve the Promise
                deferred.resolve(this.evaluations);
            }.bind(this));
    } else {
        deferred.resolve(this.evaluations);
    }

    return deferred.promise;
};

// Register service into Angular JS
angular
    .module('StepConditionsModule')
    .service('CriterionService', CriterionService);
