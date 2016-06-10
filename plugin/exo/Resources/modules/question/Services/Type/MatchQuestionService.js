import AbstractQuestionService from './AbstractQuestionService'

/**
 * Match Question Service
 * @param {FeedbackService} FeedbackService
 * @constructor
 */
function MatchQuestionService(FeedbackService) {
    AbstractQuestionService.apply(this, arguments);

    this.FeedbackService = FeedbackService;
}

// Extends AbstractQuestionCtrl
MatchQuestionService.prototype = Object.create(AbstractQuestionService.prototype);

/**
 * Initialize the answer object for the Question
 */
MatchQuestionService.prototype.initAnswer = function initAnswer() {
    return [];
};

/**
 * Get the correct answer from the solutions of a Question
 * @param   {Object} question
 * @returns {Array}
 */
MatchQuestionService.prototype.getCorrectAnswer = function getCorrectAnswer(question) {
    var answer = [];

    return answer;
};

/**
 *
 * @returns {number}
 */
MatchQuestionService.prototype.answersAllFound = function answersAllFound(question, answers) {
    var feedbackState = -1;

    if (question.solutions) {
        var numAnswersFound = 0;
        for (var j=0; j<question.solutions.length; j++) {
            for (var i=0; i<answers.length; i++) {
                var answer = answers[i].split(",");

                if (question.solutions[j].firstId === answer[0] && question.solutions[j].secondId === answer[1]) {
                    numAnswersFound++;
                }
            }
        }

        if (numAnswersFound === question.solutions.length) {
            // all answers have been found
            feedbackState = this.FeedbackService.SOLUTION_FOUND;
        } else if (numAnswersFound === question.solutions.length -1) {
            // one answer remains to be found
            feedbackState = this.FeedbackService.ONE_ANSWER_MISSING;
        } else {
            // more answers remain to be found
            feedbackState = this.FeedbackService.MULTIPLE_ANSWERS_MISSING;
        }
    }

    return feedbackState;
};

MatchQuestionService.prototype.initBindMatchQuestion = function initBindMatchQuestion() {
    jsPlumb.setContainer($("body"));

    // source elements
    $(".origin").each(function () {
        jsPlumb.addEndpoint(this, {
            anchor: 'RightMiddle',
            cssClass: "endPoints",
            isSource: true,
            maxConnections: -1
        });
    });

    // target elements
    $(".droppable").each(function () {
        jsPlumb.addEndpoint(this, {
            anchor: 'LeftMiddle',
            cssClass: "endPoints",
            isTarget: true,
            maxConnections: -1
        });
    });

    // defaults parameters for all connections
    jsPlumb.importDefaults({
        Anchors: ["RightMiddle", "LeftMiddle"],
        ConnectionsDetachable: false,
        Connector: "Straight",
        DropOptions: {tolerance: "touch"},
        HoverPaintStyle: {strokeStyle: "#FC0000"},
        LogEnabled: true,
        PaintStyle: {strokeStyle: "#777", lineWidth: 4}
    });
};

MatchQuestionService.prototype.initDragMatchQuestion = function initDragMatchQuestion() {
    jsPlumb.detachEveryConnection();
    jsPlumb.deleteEveryEndpoint();

    // activate drag on each proposal
    $(".draggable").each(function () {
        $(this).draggable({
            cursor: 'move',
            revert: 'invalid',
            helper: 'clone',
            zIndex: 10000,
            cursorAt: {top:5, left:5}
        });
    });

    $(".droppable").each(function () {
        // in exercice, if go on previous question, just visual aspect
        if ($(this).children().length > 2) {
            var children = $(this).children().length;
            var i = 2;
            // replace proposal in the div dragDropped
            for (i = 2; i < children; i++) {
                $(this).children(".dragDropped").prepend($(this).children().last().clone());
                $(this).children().last().remove();
            }
            // active the css class when drag dropped
            $(this).addClass("state-highlight");
            $(this).children(".dragDropped").children().each(function () {
                // add the image for delete drag
                var id = $(this).attr('id');
                var idDrag = $(this).attr('id');
                $(this).append("<a class='fa fa-trash' id=reset" + idDrag + "></a>");
            });
        }

        $(this).droppable({
            tolerance: "pointer",
            activeClass: "state-hover",
            hoverClass: "state-active"
        });

        $(".origin").each(function () {
            // for exercise, if go on previous question
            if ($(this).children().children().length === 0) {
                var id = $(this).attr('id');
                // make the right appearance for column of label and proposal
                $(this).children().children().children("a").remove();
                $(this).children().children().removeClass();
                $(this).children().children().addClass("draggable ui-draggable ui-draggable-disabled ui-state-disabled");
                var idDrag = id.replace('div', 'draggable');
                idDrag = "#" + idDrag;
                // discolor the text
                $(idDrag).fadeTo(100, 0.3);
            }

            $(this).droppable({
                tolerance: "pointer"
            });
        });
    });
};
