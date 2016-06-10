/**
 * Question Show Controller
 * Displays a Question
 * @param {Object}           $uibModal
 * @param {ExerciseService}  ExerciseService
 * @param {QuestionService}  QuestionService
 * @param {FeedbackService}  FeedbackService
 * @param {UserPaperService} UserPaperService
 */
var QuestionShowCtrl = function QuestionShowCtrl($uibModal, ExerciseService, QuestionService, FeedbackService, UserPaperService) {
    this.$uibModal = $uibModal;
    this.ExerciseService  = ExerciseService;
    this.QuestionService  = QuestionService;
    this.FeedbackService  = FeedbackService;
    this.UserPaperService = UserPaperService;

    this.editEnabled = this.ExerciseService.isEditEnabled();

    // Get feedback info to display the general feedback of the Question
    this.feedback = this.FeedbackService.get();

    // Force the feedback when correction is shown
    if (this.includeCorrection && !this.FeedbackService.isEnabled()) {
        this.FeedbackService.enable();
        this.FeedbackService.show();
    }
};

// Set up dependency injection
QuestionShowCtrl.$inject = [ '$uibModal', 'ExerciseService', 'QuestionService', 'FeedbackService', 'UserPaperService' ];

/**
 * Is the Question panel collapsed ?
 * @type {boolean}
 */
QuestionShowCtrl.prototype.collapsed = false;

/**
 * Current question
 * @type {Object}
 */
QuestionShowCtrl.prototype.question = {};

/**
 * Paper data for the current question
 * @type {Object}
 */
QuestionShowCtrl.prototype.questionPaper = null;

/**
 * Feedback information
 * @type {Object}
 */
QuestionShowCtrl.prototype.feedback = {};

/**
 * Is edit enabled ?
 * @type {boolean}
 */
QuestionShowCtrl.prototype.editEnabled = false;

/**
 * Are the correction for the Question displayed ?
 * @type {boolean}
 */
QuestionShowCtrl.prototype.includeCorrection = false;

/**
 * Mark the question
 */
QuestionShowCtrl.prototype.mark = function mark() {
    var question = this.question;

    this.$uibModal.open({
        templateUrl: AngularApp.webDir + 'bundles/ujmexo/js/angular/Paper/Partials/manual-mark.html',
        controller: 'ManualMarkCtrl as manualMarkCtrl',
        resolve: {
            question: function questionResolve() {
                return question;
            }
        }
    });
};

/**
 * Get the generic feedback
 * @returns {string}
 */
QuestionShowCtrl.prototype.getGenericFeedback = function getGenericFeedback() {
    if (this.feedback.state[this.question.id] === 1) {
        return "one_answer_to_find";
    } else if (this.feedback.state[this.question.id] === 2) {
        return "answers_not_found";
    }
};

/**
 * Check if a Hint has already been used (in paper)
 * @param   {Object} hint
 * @returns {Boolean}
 */
QuestionShowCtrl.prototype.isHintUsed = function isHintUsed(hint) {
    var used = false;
    if (this.questionPaper.hints) {
        for (var i = 0; i < this.questionPaper.hints.length; i++) {
            if (this.questionPaper.hints[i].id == hint.id) {
                used = true;
                break; // Stop searching
            }
        }
    }

    return used;
};

/**
 * Get hint data and update student data in common service
 * @param {Object} hint
 */
QuestionShowCtrl.prototype.showHint = function showHint(hint) {
    if (!this.isHintUsed(hint)) {
        // Load Hint data
        this.UserPaperService.useHint(this.question, hint);
    }
};

/**
 * Get Hint value (only available for loaded Hint)
 * @param {Object} hint
 */
QuestionShowCtrl.prototype.getHintValue = function getHintValue(hint) {
    var value = '';
    if (this.questionPaper.hints && this.questionPaper.hints.length > 0) {
        for (var i = 0; i < this.questionPaper.hints.length; i++) {
            if (this.questionPaper.hints[i].id == hint.id) {
                value = this.questionPaper.hints[i].value;
                break;
            }
        }
    }

    return value;
};

// Register controller into AngularJS
angular
    .module('Question')
    .controller('QuestionShowCtrl', QuestionShowCtrl);
