/* global jsPlumb */

import AbstractQuestionService from './AbstractQuestionService'

/**
 * Match Question Service
 * @param {FeedbackService} FeedbackService
 * @constructor
 */
function MatchQuestionService($log, FeedbackService) {
  AbstractQuestionService.call(this, $log, FeedbackService)
}

// Extends AbstractQuestionCtrl
MatchQuestionService.prototype = Object.create(AbstractQuestionService.prototype)

/**
 * Initialize the answer object for the Question
 */
MatchQuestionService.prototype.initAnswer = function initAnswer() {
  return []
}

/**
 * Get the correct answer from the solutions of a Question
 * @param   {Object} question
 * @returns {Array}
 */
MatchQuestionService.prototype.getCorrectAnswer = function getCorrectAnswer() {
  return []
}

/**
 * Check if association is valid or not
 * @param   {Object} question
 * @param   {Array}  association
 * @returns {boolean}
 */
MatchQuestionService.prototype.isAssociationValid = function isAssociationValid(question, association) {
  var valid = false

  if (question.solutions) {
    for (var i = 0; i < question.solutions.length; i++) {
      if (association[0] === question.solutions[i].firstId && association[1] === question.solutions[i].secondId) {
        valid = true
      }
    }
  }

  return valid
}

/**
 * @returns {number}
 */
MatchQuestionService.prototype.answersAllFound = function answersAllFound(question, answers) {
  var feedbackState = -1

  if (question.solutions) {
    const solutionsFound = this.getFoundSolutions(question, answers)

    if (solutionsFound.length === question.solutions.length) {
      // all answers have been found
      feedbackState = this.FeedbackService.SOLUTION_FOUND
    } else if (solutionsFound.length === question.solutions.length -1) {
      // one answer remains to be found
      feedbackState = this.FeedbackService.ONE_ANSWER_MISSING
    } else {
      // more answers remain to be found
      feedbackState = this.FeedbackService.MULTIPLE_ANSWERS_MISSING
    }
  }

  return feedbackState
}

MatchQuestionService.prototype.initBindMatchQuestion = function initBindMatchQuestion(element) {
  jsPlumb.setSuspendDrawing(false)

  // defaults parameters for all connections
  jsPlumb.importDefaults({
    Anchors: ['RightMiddle', 'LeftMiddle'],
    ConnectionsDetachable: true,
    Connector: 'Straight',
    DropOptions: {tolerance: 'touch'},
    HoverPaintStyle: {strokeStyle: '#FC0000'},
    LogEnabled: true,
    PaintStyle: {strokeStyle: '#777', lineWidth: 4}
  })

  jsPlumb.registerConnectionTypes({
    right: {
      paintStyle     : { strokeStyle: '#5CB85C', lineWidth: 5 },
      hoverPaintStyle: { strokeStyle: 'green',   lineWidth: 6 }
    },
    wrong: {
      paintStyle:      { strokeStyle: '#D9534F', lineWidth: 5 },
      hoverPaintStyle: { strokeStyle: 'red',     lineWidth: 6 }
    },
    default: {
      paintStyle     : { strokeStyle: 'grey',    lineWidth: 5 },
      hoverPaintStyle: { strokeStyle: '#FC0000', lineWidth: 6 }
    }
  })

  jsPlumb.setContainer(element)

  jsPlumb.addEndpoint(jsPlumb.getSelector('.source'), {
    anchor: 'RightMiddle',
    cssClass: 'endPoints',
    isSource: true,
    maxConnections: -1
  })

  jsPlumb.addEndpoint(jsPlumb.getSelector('.target'), {
    anchor: 'LeftMiddle',
    cssClass: 'endPoints',
    isTarget: true,
    maxConnections: -1
  })
}

MatchQuestionService.prototype.initDragMatchQuestion = function initDragMatchQuestion(element) {
  element.find('.draggable').draggable({
    cursor: 'move',
    revert: 'invalid',
    helper: 'clone',
    zIndex: 10000,
    cursorAt: { top:5, left:5 }
  })

  element.find('.droppable').droppable({
    tolerance: 'pointer',
    activeClass: 'state-active',
    hoverClass: 'state-hover'
  })
}

MatchQuestionService.prototype.getTotalScore = function (question) {
  let total = 0

  if (question.solutions) {
    for (let i = 0; i < question.solutions.length; i++) {
      total += question.solutions[i].score
    }
  }

  return total
}

MatchQuestionService.prototype.getAnswerScore = function (question, answer) {
  let score = 0

  const solutionsFound = this.getFoundSolutions(question, answer)
  for (let i = 0; i < solutionsFound.length; i++) {
    score += solutionsFound[i].score
  }

  if (0 > score) {
    score = 0
  }

  return score
}

MatchQuestionService.prototype.getFoundSolutions = function (question, answer) {
  const found = []
  if (answer && question.solutions) {
    for (var j = 0; j < question.solutions.length; j++) {
      for (var i = 0; i < answer.length; i++) {
        let parts = answer[i].split(',')

        if (question.solutions[j].firstId === parts[0] && question.solutions[j].secondId === parts[1]) {
          found.push(question.solutions[j])
        }
      }
    }
  }

  return found
}

export default MatchQuestionService
