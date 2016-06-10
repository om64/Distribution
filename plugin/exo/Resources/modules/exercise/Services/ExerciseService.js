/**
 * Exercise Service
 * @param {Object} $http
 * @param {Object} $q
 * @constructor
 */
function ExerciseService($http, $q) {
    this.$http = $http;
    this.$q    = $q;
};

/**
 * Current Exercise
 * @type {Object}
 */
ExerciseService.prototype.exercise = null;

/**
 * List of available correction modes for Exercise
 * @type {Object}
 */
ExerciseService.prototype.correctionModes = {
    '1': Translator.trans('at_the_end_of_assessment', {}, 'ujm_exo'),
    '2': Translator.trans('after_the_last_attempt', {}, 'ujm_exo'),
    '3': Translator.trans('from', {}, 'ujm_exo'),
    '4': Translator.trans('never', {}, 'ujm_exo')
};

/**
 * List of available mark modes for Exercise
 * @type {Object}
 */
ExerciseService.prototype.markModes = {
    '1': Translator.trans('at_the_same_time_that_the_correction', {}, 'ujm_exo'),
    '2': Translator.trans('at_the_end_of_assessment', {}, 'ujm_exo')
};

/**
 * Is the current User can edit the Exercise ?
 * @type {boolean}
 */
ExerciseService.prototype.editEnabled = false;

/**
 * Get the current Exercise
 * @returns {Object}
 */
ExerciseService.prototype.getExercise = function getExercise() {
    return this.exercise;
};

/**
 * Set the current Exercise
 * @param   {Object} exercise
 * @returns {ExerciseService}
 */
ExerciseService.prototype.setExercise = function setExercise(exercise) {
    this.exercise = exercise;

    return this;
};

/**
 * Is edit enabled ?
 * @returns {boolean}
 */
ExerciseService.prototype.isEditEnabled = function isEditEnabled() {
    return this.editEnabled;
};

/**
 * Set edit enabled
 * @param   {boolean} editEnabled
 * @returns {ExerciseService}
 */
ExerciseService.prototype.setEditEnabled = function setEditEnabled(editEnabled) {
    this.editEnabled = editEnabled;

    return this;
};

/**
 * Get the total score of the Exercise
 * @returns {number}
 */
ExerciseService.prototype.getScoreTotal = function getScoreTotal() {
    var scoreTotal = 0;
    if (this.exercise && this.exercise.steps) {
        for (var i = 0; i < this.exercise.steps.length; i++) {
            var step = this.exercise.steps[i];
            for (var j = 0; j < step.items.length; j++) {
                if (step.items[j].scoreTotal) {
                    scoreTotal += step.items[j].scoreTotal;
                }
            }
        }
    }

    return scoreTotal;
};

/**
 * Check if the current Exercise has questions that need manual correction (eg. long open question)
 */
ExerciseService.prototype.needManualCorrection = function needManualCorrection() {
    var needed = false;
    if (this.exercise && this.exercise.steps && 0 !== this.exercise.steps.length) {
        // Exercise has steps
        for (var i = 0; i < this.exercise.steps.length; i++) {
            var step = this.exercise.steps[i];
            if (step && step.items && 0 !== step.items.length) {
                // Step has items
                for (var j = 0; j < step.items.length; j++){
                    if (step.items[j].typeOpen && step.items[j].typeOpen === 'long'){
                        needed = true;
                        break;
                    }
                }
            }
        }
    }

    return needed;
};

/**
 * Save modifications of the metadata of the Exercise
 * @param   {Object} metadata
 * @returns {Promise}
 */
ExerciseService.prototype.save = function save(metadata) {
    var deferred = this.$q.defer();

    this.$http
        .put(
            Routing.generate('ujm_exercise_update_meta', { id: this.exercise.id }),
            metadata
        )
        .success(function onSuccess(response) {
            // TODO : display message

            // Inject updated data into the Exercise
            angular.merge(this.exercise.meta, response.meta);

            deferred.resolve(response);
        }.bind(this))
        .error(function onError(response, status) {
            // TODO : display message

            deferred.reject(response);
        });

    return deferred.promise;
};

/**
 * Get metadata of an Exercise
 * @returns {Array}
 */
ExerciseService.prototype.getMetadata = function getSteps() {
    return this.exercise.meta;
};

/**
 * Get steps of an Exercise
 * @returns {Array}
 */
ExerciseService.prototype.getSteps = function getSteps() {
    return this.exercise.steps;
};

/**
 * Get an Exercise step by its ID
 * @param   {string} stepId
 * @returns {Object}
 */
ExerciseService.prototype.getStep = function getStep(stepId) {
    var step = null;
    if (this.exercise.steps) {
        for (var i = 0; i < this.exercise.steps.length; i++) {
            if (stepId == this.exercise.steps[i].id) {
                step = this.exercise.steps[i];
                break;
            }
        }
    }

    return step;
};

/**
 * Get the index of a Step
 * @param   {Object} step
 * @returns {Number}
 */
ExerciseService.prototype.getIndex = function getIndex(step) {
    return (this.exercise && this.exercise.steps) ? this.exercise.steps.indexOf(step) : -1;
};

/**
 * Get the previous step of a step
 * @param   {Object} step
 * @returns {Object}
 */
ExerciseService.prototype.getPrevious = function getPrevious(step) {
    var previous = null;

    var pos = this.getIndex(step);
    if (-1 !== pos && this.exercise.steps && this.exercise.steps[pos - 1]) {
        previous = this.exercise.steps[pos - 1];
    }

    return previous;
};

/**
 * Get the next step of a step
 * @param   {Object} step
 * @returns {Object}
 */
ExerciseService.prototype.getNext = function getNext(step) {
    var next = null;

    var pos = this.getIndex(step);
    if (-1 !== pos && this.exercise.steps && this.exercise.steps[pos + 1]) {
        next = this.exercise.steps[pos + 1];
    }

    return next;
};

/**
 * Reorder the Steps of the current Exercise.
 */
ExerciseService.prototype.reorderSteps = function reorderSteps() {
    // Only send the IDs of the steps
    var order = this.exercise.steps.map(function getIds(step) {
        return step.id;
    });

    var deferred = this.$q.defer();
    this.$http
        .put(
            Routing.generate('exercise_step_reorder', { exerciseId: this.exercise.id }),
            order
        )
        .success(function onSuccess(response) {
            deferred.resolve(response);
        })
        .error(function onError(data, status) {
            deferred.reject([]);
        });

    return deferred.promise;
};

/**
 * Add a new Step to the Exercise
 */
ExerciseService.prototype.addStep = function addStep() {
    if (!this.exercise.steps) {
        this.exercise.steps = [];
    }

    // Initialize a new Step
    var step = {
        id: null,
        items: []
    };

    // Add to the steps list
    this.exercise.steps.push(step);

    // Send step to the server
    var deferred = this.$q.defer();
    this.$http
        .post(
            Routing.generate('exercise_step_add', { exerciseId: this.exercise.id }),
            step
        )
        // Success callback
        .success(function (response) {
            // Get the information of the Step
            step.id = response.id;

            deferred.resolve(response);
        })
        // Error callback
        .error(function (data, status) {
            // Remove step
            var pos = this.exercise.steps.indexOf(step);
            if (-1 !== pos) {
                this.exercise.steps.splice(pos, 1);
            }

            // TODO : display error message

            deferred.reject({});
        }.bind(this));

    return deferred.promise;
};

ExerciseService.prototype.removeStep = function removeStep(step) {
    // Store a copy of the item if something goes wrong
    var stepBack = angular.copy(step, {});

    // Remove item from Step
    var pos = this.exercise.steps.indexOf(step);
    if (-1 !== pos) {
        this.exercise.steps.splice(pos, 1);
    }

    var deferred = this.$q.defer();
    this.$http
        .delete(
            Routing.generate('exercise_step_delete', { exerciseId: this.exercise.id, id: step.id })
        )
        // Success callback
        .success(function (response) {
            deferred.resolve(response);
        })
        // Error callback
        .error(function (data, status) {
            // Restore item
            // TODO : push step at the correct position
            this.exercise.steps.push(stepBack);

            // TODO : display error message

            deferred.reject({});
        }.bind(this));

    return deferred.promise;
};

ExerciseService.prototype.removeItem = function removeItem(step, item) {
    // Store a copy of the item if something goes wrong
    var itemBack = angular.copy(item, {});

    // Remove item from Step
    var pos = step.items.indexOf(item);
    if (-1 !== pos) {
        step.items.splice(pos, 1);
    }

    var deferred = this.$q.defer();
    this.$http
        .delete(
            Routing.generate('ujm_exercise_question_delete', { id: this.exercise.id, qid: item.id })
        )
        // Success callback
        .success(function (response) {
            deferred.resolve(response);
        })
        // Error callback
        .error(function (data, status) {
            // Restore item
            step.items.push(itemBack);

            // TODO : display error message

            deferred.reject({});
        }.bind(this));

    return deferred.promise;
};

/**
 * Publish the current Exercise
 * @returns {ExerciseService}
 */
ExerciseService.prototype.publish = function publish() {
    var deferred = this.$q.defer();

    // We anticipate the success of the publishing (that's just a boolean change on boolean flag)
    var publishedOnceBackup = this.exercise.meta.publishedOnce;

    this.exercise.meta.published     = true;
    this.exercise.meta.publishedOnce = true;

    this.$http
        .post(
            Routing.generate('ujm_exercise_publish', { id: this.exercise.id })
        )
        // Success callback
        .success(function (response) {
            // TODO : display success message

            deferred.resolve(response);
        })
        // Error callback
        .error(function (data, status) {
            // Remove published flags
            this.exercise.meta.published     = false;
            this.exercise.meta.publishedOnce = publishedOnceBackup;

            // TODO : display error message

            deferred.reject({});
        }.bind(this));

    return deferred.promise;
};

/**
 * Unpublish the current Exercise
 * @returns {ExerciseService}
 */
ExerciseService.prototype.unpublish = function unpublish() {
    var deferred = this.$q.defer();

    // We anticipate the success of the publishing (that's just a change on boolean flag)
    this.exercise.meta.published = false;

    this.$http
        .post(
            Routing.generate('ujm_exercise_unpublish', { id: this.exercise.id })
        )
        // Success callback
        .success(function (response) {
            // TODO : display success message

            deferred.resolve(response);
        })
        // Error callback
        .error(function (data, status) {
            // Remove published flags
            this.exercise.meta.published = true;

            // TODO : display error message

            deferred.reject({});
        }.bind(this));

    return deferred.promise;
};

export default ExerciseService
