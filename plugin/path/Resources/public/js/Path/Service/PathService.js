/**
 * Path Service
 *
 * @param {Object} $http
 * @param {Object} $q
 * @param {Function} $timeout
 * @param {Object} $location
 * @param {AlertService} AlertService
 * @param {StepService} StepService
 *
 * @constructor
 */
var PathService = function PathService($http, $q, $timeout, $location, AlertService, StepService) {
    this.$http = $http;
    this.$q = $q;
    this.$timeout = $timeout;
    this.$location = $location;
    this.AlertService = AlertService;
    this.StepService = StepService;
};

// Set up dependency injection
PathService.$inject = [
    '$http',
    '$q',
    '$timeout',
    '$location',
    'AlertService',
    'StepService'
];

/**
 * ID of the Path
 * @type {Number}
 */
PathService.prototype.id = null;

/**
 * Data of the Path
 * @type {object}
 */
PathService.prototype.path = null;

/**
 * Maximum depth of a Path
 * @type {number}
 */
PathService.prototype.maxDepth = 8;

/**
 * State of the Path summary
 * @type {object}
 */
PathService.prototype.summary = {
    opened: true
};

/**
 * is condition blocking all children of a step
 * @type {boolean}
 */
PathService.prototype.completeBlockingCondition = true;

/**
 * Get current Path
 * @returns {Object}
 */
PathService.prototype.getPath = function getPath() {
    return this.path;
};

/**
 * Set current Path
 * @param {Object} value
 */
PathService.prototype.setPath = function setPath(value) {
    this.path = value;
};

/**
 * Get max depth of the Path
 * @returns {Number}
 */
PathService.prototype.getMaxDepth = function getMaxDepth() {
    return this.maxDepth;
};

/**
 * Get summary state
 * @returns {Object}
 */
PathService.prototype.getSummaryState = function getSummaryState() {
    return this.summary;
};

/**
 * Toggle summary state
 */
PathService.prototype.toggleSummaryState = function toggleSummaryState() {
    this.summary.opened = !this.summary.opened;
};

/**
 * Set summary state
 * @param {Boolean} value
 */
PathService.prototype.setSummaryState = function setSummaryState(value) {
    this.summary.opened = value;
};

PathService.prototype.setCompleteBlockingCondition = function setCompleteBlockingCondition(value) {
    this.completeBlockingCondition = value;
};

PathService.prototype.isCompleteBlockingCondition = function isCompleteBlockingCondition() {
    return this.completeBlockingCondition;
};

/**
 * Initialize a new Path structure
 */
PathService.prototype.initialize = function initialize() {
    // Create a generic root step
    var rootStep = this.StepService.new();

    this.path.steps.push(rootStep);

    // Set root step as current step
    this.goTo(rootStep);
};

/**
 * Initialize a new Path structure from a Template
 */
PathService.prototype.initializeFromTemplate = function initializeFromTemplate() {

};

PathService.prototype.conditionValidityCheck = function conditionValidityCheck() {
    return true;
};

/**
 * Save modification to DB
 */
PathService.prototype.save = function save() {
    // Transform data to make it acceptable by Symfony
    var dataToSave = {
        innova_path: {
            name:             this.path.name,
            description:      this.path.description,
            breadcrumbs:      this.path.breadcrumbs,
            summaryDisplayed: this.path.summaryDisplayed,
            completeBlockingCondition: this.path.completeBlockingCondition,
            structure:        angular.toJson(this.path)
        }
    };

    // Initialize a new Promise
    var deferred = this.$q.defer();
    this.$http
        .put(Routing.generate('innova_path_editor_wizard_save', { id: this.path.id }), dataToSave)

        .success(function (response) {
            if ('ERROR_VALIDATION' === response.status) {
                // Display received error messages
                for (var i = 0; i < response.messages.length; i++) {
                    this.AlertService.addAlert('error', response.messages[i]);
                }

                // Reject the Promise
                deferred.reject(response);
            } else {
                // Get updated data
                angular.merge(this.path, response.data);

                // Display confirm message
                this.AlertService.addAlert('success', Translator.trans('path_save_success', {}, 'path_wizards'));

                // Resolve the Promise
                deferred.resolve(response);
            }
        }.bind(this))

        .error(function (response) {
            // Display generic error for the User
            this.AlertService.addAlert('error', Translator.trans('path_save_error', {}, 'path_wizards'));

            // Reject the Promise
            deferred.reject(response);
        }.bind(this));

    return deferred.promise;
};

/**
 * Publish path modifications
 */
PathService.prototype.publish = function publish() {
    // Initialize a new Promise
    var deferred = this.$q.defer();

    this.$http
        .put(Routing.generate('innova_path_publish', { id: this.path.id }))

        .success(function (response) {
            if ('ERROR' === response.status) {
                // Store received errors in AlertService to display them to the User
                for (var i = 0; i < response.messages.length; i++) {
                    this.AlertService.addAlert('error', response.messages[i]);
                }

                // Reject the promise
                deferred.reject(response);
            } else {
                // Get updated data
                angular.merge(this.path, response.data);

                // Display confirm message
                this.AlertService.addAlert('success', Translator.trans('publish_success', {}, 'path_wizards'));

                // Resolve the promise
                deferred.resolve(response);
            }
        }.bind(this))

        .error(function (response) {
            // Display generic error to the User
            this.AlertService.addAlert('error', Translator.trans('publish_error', {}, 'path_wizards'));

            // Reject the Promise
            deferred.reject(response);
        }.bind(this));

    return deferred.promise;
};

/**
 * Display the step
 * @param step
 */
PathService.prototype.goTo = function goTo(step) {
    // Ugly as fuck, but can't make it work without timeout
    this.$timeout(function () {
        if (angular.isObject(step)) {
            this.$location.path('/' + step.id);
        } else {
            // User must be able to navigate to root step, so does not check authorization
            this.$location.path('/');
        }
    }.bind(this), 1);
};

/**
 * Get the previous step
 * @param step
 * @returns {Object|Step}
 */
PathService.prototype.getPrevious = function getPrevious(step) {
    var previous = null;

    // If step is the root of the tree it has no previous element
    if (angular.isDefined(step) && angular.isObject(step) && 0 !== step.lvl) {
        var parent = this.getParent(step);
        if (angular.isObject(parent) && angular.isObject(parent.children)) {
            // Get position of the current element
            var position = parent.children.indexOf(step);
            if (-1 !== position && angular.isObject(parent.children[position - 1])) {
                // Previous sibling found
                var previousSibling = parent.children[position - 1];

                // Get down to the last child of the sibling
                var lastChild = this.getLastChild(previousSibling);
                if (angular.isObject(lastChild)) {
                    previous = lastChild;
                } else {
                    // Get the sibling
                    previous = previousSibling;
                }
            } else {
                // Get the parent as previous element
                previous = parent;
            }
        }
    }

    return previous;
};

/**
 * Get the last child of a step
 * @param step
 * @returns {Object|Step}
 */
PathService.prototype.getLastChild = function getLastChild(step) {
    var lastChild = null;

    if (angular.isDefined(step) && angular.isObject(step) && angular.isObject(step.children) && angular.isObject(step.children[step.children.length - 1])) {
        // Get the element in children collection (children are ordered)
        var child = step.children[step.children.length - 1];
        if (!angular.isObject(child.children) || 0 >= child.children.length) {
            // It is the last child
            lastChild = child;
        } else {
            // Go deeper to search for the last child
            lastChild = this.getLastChild(child);
        }
    }

    return lastChild;
};

/**
 * Get the next step
 * @param step
 * @returns {Object|Step}
 */
PathService.prototype.getNext = function getNext(step) {
    var next = null;

    if (angular.isDefined(step) && angular.isObject(step)) {
        if (angular.isObject(step.children) && angular.isObject(step.children[0])) {
            // Get the first child
            next = step.children[0];
        } else if (0 !== step.lvl) {
            // Get the next sibling
            next = this.getNextSibling(step);
        }
    }

    return next;
};

/**
 * Retrieve the next sibling of an element
 * @param step
 * @returns {Object|Step}
 */
PathService.prototype.getNextSibling = function getNextSibling(step) {
    var sibling = null;

    if (0 !== step.lvl) {
        var parent = this.getParent(step);
        if (angular.isObject(parent.children)) {
            // Get position of the current element
            var position = parent.children.indexOf(step);
            if (-1 !== position && angular.isObject(parent.children[position + 1])) {
                // Next sibling found
                sibling = parent.children[position + 1];
            }
        }

        if (null == sibling) {
            // Sibling not found => try to ascend one level
            sibling = this.getNextSibling(parent);
        }
    }

    return sibling;
};

/**
 * Get all parents of a Step (from the Root to the nearest step parent)
 * @param step
 * @param [reverse] - sort parents from the nearest parent to the Root
 */
PathService.prototype.getParents = function getParents(step, reverse) {
    var parents = [];

    var parent = this.getParent(step);
    if (parent) {
        // Add parent to the list
        parents.push(parent);

        // Get other parents
        parents = parents.concat(this.getParents(parent));

        // Reorder parent array
        parents.sort(function (a, b) {
            if (a.lvl < b.lvl) {
                return -1;
            } else if (a.lvl > b.lvl) {
                return 1;
            }

            return 0;
        });

        if (reverse) {
            parents.reverse();
        }
    }

    return parents;
};

/**
 * Get the parent of a step
 * @param step
 */
PathService.prototype.getParent = function getParent(step) {
    var parentStep = null;

    this.browseSteps(this.path.steps, function (parent, current) {
        if (step.id == current.id) {
            parentStep = parent;

            return true;
        }

        return false
    });

    return parentStep;
};

/**
 * Loop over all steps of path and execute callback
 * Iteration stops when callback returns true
 * @param {Array}    steps    - an array of steps to browse
 * @param {Function} callback - a callback to execute on each step (called with args `parentStep`, `currentStep`)
 */
PathService.prototype.browseSteps = function browseSteps(steps, callback) {
    /**
     * Recursively loop through the steps to execute callback on each step
     * @param   {object} parentStep
     * @param   {object} currentStep
     * @returns {boolean}
     */
    function recursiveLoop(parentStep, currentStep) {
        var terminated = false;

        // Execute callback on current step
        if (typeof callback === 'function') {
            terminated = callback(parentStep, currentStep);
        }

        if (!terminated && typeof currentStep.children !== 'undefined' && currentStep.children.length !== 0) {
            for (var i = 0; i < currentStep.children.length; i++) {
                terminated = recursiveLoop(currentStep, currentStep.children[i]);
            }
        }
        return terminated;
    }

    if (typeof steps !== 'undefined' && steps.length !== 0) {
        for (var j = 0; j < steps.length; j++) {
            var terminated = recursiveLoop(null, steps[j]);

            if (terminated) {
                break;
            }
        }
    }
};

/**
 * Recalculate steps level in tree
 * @param {Array} steps - an array of steps to reorder
 */
PathService.prototype.reorderSteps = function reorderSteps(steps) {
    this.browseSteps(steps, function (parent, step) {
        if (null !== parent) {
            step.lvl = parent.lvl + 1;
        } else {
            step.lvl = 0;
        }
    });
};

/**
 * Add a new child Step to the parent
 * @param {Object}  parent     - The parent step
 * @param {Boolean} displayNew - If true, the router will redirect to the created step
 */
PathService.prototype.addStep = function addStep(parent, displayNew) {
    if (parent.lvl < this.maxDepth) {
        // Create a new step
        var step = this.StepService.new(parent);

        if (displayNew) {
            // Open created step
            this.goTo(step);
        }
    }
};

/**
 * Remove a step from the path's tree
 * @param {Array}  steps        - an array of steps to browse
 * @param {Object} stepToDelete - the step to delete
 */
PathService.prototype.removeStep = function removeStep(steps, stepToDelete) {
    this.browseSteps(steps, function (parent, step) {
        var deleted = false;
        if (step === stepToDelete) {
            if (typeof parent !== 'undefined' && null !== parent) {
                var pos = parent.children.indexOf(stepToDelete);
                if (-1 !== pos) {
                    parent.children.splice(pos, 1);

                    deleted = true;
                }
            } else {
                // We are deleting the root step
                var pos = steps.indexOf(stepToDelete);
                if (-1 !== pos) {
                    steps.splice(pos, 1);

                    deleted = true;
                }
            }
        }

        return deleted;
    });
};

/**
 * Get the Root of the Path
 * @returns {Object}
 */
PathService.prototype.getRoot = function getRoot() {
    var root = null;

    if (angular.isDefined(this.path) && angular.isObject(this.path) && angular.isObject(this.path.steps) && angular.isObject(this.path.steps[0])) {
        root = this.path.steps[0];
    }

    return root;
};

/**
 * Find a Step in the Path by its ID
 * @param   {number} stepId
 * @returns {object}
 */
PathService.prototype.getStep = function getStep(stepId) {
    var step = null;

    if (angular.isDefined(this.path) && angular.isObject(this.path)) {
        this.browseSteps(this.path.steps, function searchStep(parent, current) {
            if (current.id == stepId) {
                step = current;

                return true; // Kill the search
            }

            return false;
        });
    }

    return step;
};

/**
 * Get inherited resources from `steps` of the Step
 * @param   {Array}  steps - The list of Steps in which we need to search the InheritedResources
 * @param   {Object} step  - The current Step
 * @returns {Array}
 */
PathService.prototype.getStepInheritedResources = function getStepInheritedResources(steps, step) {
    function retrieveInheritedResources(stepToFind, currentStep, inheritedResources) {
        var stepFound = false;

        if (stepToFind.id !== currentStep.id && typeof currentStep.children !== 'undefined' && null !== currentStep.children) {
            // Not the step we search for => search in children
            for (var i = 0; i < currentStep.children.length; i++) {
                stepFound = retrieveInheritedResources(stepToFind, currentStep.children[i], inheritedResources);
                if (stepFound) {
                    if (typeof currentStep.resources !== 'undefined' && null !== currentStep.resources) {
                        // Get all resources which must be sent to children
                        for (var j = currentStep.resources.length - 1; j >= 0; j--) {
                            if (currentStep.resources[j].propagateToChildren) {
                                // Current resource must be available for children
                                var resource = angular.copy(currentStep.resources[j]);
                                resource.parentStep = {
                                    id: currentStep.id,
                                    lvl: currentStep.lvl,
                                    name: currentStep.name
                                };
                                resource.isExcluded = stepToFind.excludedResources.indexOf(resource.id) != -1;
                                inheritedResources.unshift(resource);
                            }
                        }
                    }
                    break;
                }
            }
        }
        else {
            stepFound = true;
        }

        return stepFound;
    }

    var stepFound = false;
    var inheritedResources = [];

    if (steps && steps.length !== 0) {
        // Loop over first level of Steps and search recursively in children for finding InheritedResources
        for (var i = 0; i < steps.length; i++) {
            var currentStep = steps[i];
            stepFound = retrieveInheritedResources(step, currentStep, inheritedResources);
            if (stepFound) {
                break;
            }
        }
    }

    return inheritedResources;
};

// Register service into Angular JS
angular
    .module('PathModule')
    .service('PathService', PathService);
