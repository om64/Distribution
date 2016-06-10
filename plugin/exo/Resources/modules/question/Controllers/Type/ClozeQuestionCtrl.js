import AbstractQuestionCtrl from './AbstractQuestionCtrl'

/**
 * Cloze Question Controller
 * @param {FeedbackService}      FeedbackService
 * @param {ClozeQuestionService} ClozeQuestionService
 * @constructor
 */
function ClozeQuestionCtrl(FeedbackService, ClozeQuestionService) {
    AbstractQuestionCtrl.apply(this, arguments);

    this.ClozeQuestionService = ClozeQuestionService;

    for (var i = 0; i < this.question.holes.length; i++) {
        this.question.holes[i].valid = 0;
    }
}

// Extends AbstractQuestionCtrl
ClozeQuestionCtrl.prototype = Object.create(AbstractQuestionCtrl.prototype);

/**
 * Stores Holes to be able to toggle there state
 * This object is populated while compiling the directive to add data-binding on cloze
 * @type {Object}
 */
ClozeQuestionCtrl.prototype.holes = {};

/**
 * Check whether a Hole is valid or not
 * @param   {Object} hole
 * @returns {Boolean}
 */
ClozeQuestionCtrl.prototype.isHoleValid = function isHoleValid(hole) {
    var answer = this.getHoleAnswer(hole);
    if (answer) {
        var correct = this.ClozeQuestionService.getHoleCorrectAnswer(this.question, hole);
        if (correct) {
            // The right response has been found, we can check the User answer
            if (hole.selector) {
                return answer.answerText === correct.id;
            } else {
                return !!((correct.caseSensitive && correct.text === answer.answerText)
                || (!correct.caseSensitive && correct.text.toLowerCase() === answer.answerText.toLowerCase()));
            }
        }
    }
};

/**
 * Get the User answer for a Hole
 * @param   {Object} hole
 * @returns {Object}
 */
ClozeQuestionCtrl.prototype.getHoleAnswer = function getHoleAnswer(hole) {
    var answer = this.ClozeQuestionService.getHoleAnswer(this.answer, hole);
    if (null === answer) {
        // Generate an empty response
        answer = {
            holeId     : hole.id,
            answerText : ''
        };

        // Add to the list of answers
        this.answer.push(answer);
    }

    return answer;
};

/**
 * Get the Feedback of a Hole
 * @param   {Object} hole
 * @returns {string}
 */
ClozeQuestionCtrl.prototype.getHoleFeedback = function getHoleFeedback(hole) {
    return this.ClozeQuestionService.getHoleFeedback(this.question, hole);
};

/**
 * Validate Holes when feedback are shown to know which answers are valid
 */
ClozeQuestionCtrl.prototype.onFeedbackShow = function onFeedbackShow() {
    // Validate holes
    if (this.question.solutions) {
        for (var holeId in this.holes) {
            if (this.holes.hasOwnProperty(holeId)) {
                this.holes[holeId].valid = this.isHoleValid(this.holes[holeId]);
            }
        }
    }
};

export default ClozeQuestionCtrl
