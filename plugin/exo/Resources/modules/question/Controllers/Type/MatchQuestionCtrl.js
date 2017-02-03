import AbstractQuestionCtrl from './AbstractQuestionCtrl'

/**
 * Choice Question Controller
 * @param {FeedbackService}      FeedbackService
 * @param {Object}               $scope
 * @param {Object}               $uibModal
 * @param {MatchQuestionService} MatchQuestionService
 * @constructor
 */
function MatchQuestionCtrl(FeedbackService, $scope, $uibModal, MatchQuestionService) {
  AbstractQuestionCtrl.apply(this, arguments)

  this.$scope = $scope
  this.$uibModal = $uibModal
  this.MatchQuestionService = MatchQuestionService
}

// Extends AbstractQuestionCtrl
MatchQuestionCtrl.prototype = Object.create(AbstractQuestionCtrl.prototype)

MatchQuestionCtrl.prototype.connections = [] // for toBind questions

MatchQuestionCtrl.prototype.dropped = [] // for to drag questions

MatchQuestionCtrl.prototype.orphanAnswers = []

MatchQuestionCtrl.prototype.orphanAnswersAreChecked = false

MatchQuestionCtrl.prototype.savedAnswers = []

/**
 * Zoom on an item content (display it in a modal)
 * @param {mixed} itemData
 */
MatchQuestionCtrl.prototype.zoom = function zoom(itemData) {
  this.$uibModal.open({
    template: '<div class="modal-body" data-ng-bind-html="zoomCtrl.data | unsafe"></div>',
    controllerAs: 'zoomCtrl',
    controller: function ZoomCtrl(data) {
      this.data = data
    },
    resolve: {
      data: function () {
        return itemData
      }
    }
  })
}

/**
 *
 * @param item
 * @returns {boolean}
 */
MatchQuestionCtrl.prototype.answerIsSaved = function answerIsSaved(item) {
  return (this.savedAnswers.indexOf(item) !== -1)
}

/**
 * Check if all answers are good and complete
 * and colours the panel accordingly
 * @param {type} label
 * @returns {Boolean}
 */
MatchQuestionCtrl.prototype.checkAnswerValidity = function checkAnswerValidity(label) {
  var answers
  if (this.question.toBind) {
    answers = this.connections
  } else {
    answers = this.dropped
  }

  // set the orphan answers list
  // (runs only once)
  if (!this.orphanAnswersAreChecked) {
    var hasSolution
    for (let i = 0; i < this.question.secondSet.length; i++) {
      hasSolution = false
      for (let j = 0; j < this.question.solutions.length; j++) {
        if (this.question.secondSet[i].id === this.question.solutions[j].secondId) {
          hasSolution = true
        }
      }

      if (!hasSolution) {
        this.orphanAnswers.push(this.question.secondSet[i])
      }
    }

    this.orphanAnswersAreChecked = true
  }

  /**
   * Check if all the right answers are selected by the student
   */
  var valid = true
  var subvalid

  if (this.question.solutions) {
    for (let i = 0; i < this.question.solutions.length; i++) {
      if (this.question.solutions[i].secondId === label.id) {
        subvalid = false
        for (let j = 0; j<answers.length; j++) {
          if (this.question.solutions[i].firstId === answers[j].source && this.question.solutions[i].secondId === answers[j].target) {
            subvalid = true
          }
        }

        if (subvalid === false) {
          valid = false
        }
      }
    }
  }

  /**
   * Check if there are wrong answers selected by the student
   */
  var valid3 = true
  for (let i = 0; i < answers.length; i++) {
    if (answers[i].target === label.id) {
      subvalid = this.dropIsValid(answers[i])
      if (subvalid === 2) {
        valid3 = false
      }
    }
  }

  /**
   * Check if this label is an orphan, and if so,
   * check if the student left it unconnected
   */
  var valid2 = false
  for (let i = 0; i < this.orphanAnswers.length; i++) {
    if (this.orphanAnswers[i].id === label.id) {
      valid2 = true
      for (let j = 0; j < answers.length; j++) {
        if (this.orphanAnswers[i].id === answers[j].target) {
          valid2 = false
        }
      }
    }
  }

  if (valid2) {
    return true
  } else {
    return valid && valid3
  }
}

MatchQuestionCtrl.prototype.colorBindings = function colorBindings() {
  for (let i=0; i<this.connections.length; i++) {
    var rightAnswer = false
    var c = jsPlumb.select({source: 'draggable_' + this.connections[i].source, target: 'droppable_' + this.connections[i].target})
    for (let k=0; k<this.question.firstSet.length; k++) {
      for (let l=0; l<this.question.secondSet.length; l++) {
        if (this.question.firstSet[k].id === this.connections[i].source && this.question.secondSet[l].id === this.connections[i].target) {
          for (let j=0; j<this.question.solutions.length; j++) {
            if (this.connections[i].source === this.question.solutions[j].firstId && this.connections[i].target === this.question.solutions[j].secondId) {
              rightAnswer = true
              c.setType('right')
              /*
               * The following line adds the specific feedback on right bingings
               * We decided not to show it, as it can easily take too much space on the bindings
               * The best way would be to show it on hover
               *
               * c.setLabel({label: this.question.solutions[j].feedback, cssClass: 'label label-success'})
               */
            }
          }
          if (!rightAnswer) {
            if (this.feedback.visible) {
              c.setType('wrong')
            } else {
              c.setType('default')
            }
          }
        }
      }
    }
  }
}

MatchQuestionCtrl.prototype.dropIsValid = function dropIsValid(item) {
  if (this.question.solutions) {
    for (let i = 0; i < this.question.solutions.length; i++) {
      if (item.source === this.question.solutions[i].firstId && item.target === this.question.solutions[i].secondId) {
        return 1
      }
    }
  }

  return 2
}

/**
 * Get the correct answers for this label
 * @param {type} label
 * @returns {Array}
 */
MatchQuestionCtrl.prototype.getCorrectAnswers = function getCorrectAnswers(label) {
  var correctAnswers = []
  var answersToShow = []

  if (this.question.solutions) {
    for (let i = 0; i < this.question.solutions.length; i++) {
      if (this.question.solutions[i].secondId === label.id) {
        for (let j = 0; j< this.question.firstSet.length; j++) {
          if (this.question.firstSet[j].id === this.question.solutions[i].firstId) {
            correctAnswers.push(this.question.firstSet[j].data)
          }
        }
      }
    }
  }

  var studentAnswers = this.getStudentAnswers(label)

  for (let i = 0; i < correctAnswers.length; i++) {
    var selected = false
    for (let j = 0; j < studentAnswers.length; j++) {
      if (correctAnswers[i] === studentAnswers[j]) {
        selected = true
      }
    }
    if (selected) {
      answersToShow.push(correctAnswers[i])
    }
  }

  return answersToShow
}

MatchQuestionCtrl.prototype.getCurrentItemFeedBack = function getCurrentItemFeedBack(label) {
  if (this.question.solutions) {
    for (let i=0; i < this.question.solutions.length; i++) {
      if (this.question.solutions[i].secondId === label.id) {
        return this.question.solutions[i].feedback
      }
    }
  }
}

MatchQuestionCtrl.prototype.getCurrentItemFeedBackIfOk = function getCurrentItemFeedBackIfOk(label) {
  if (!this.isRemovableItem(label.id, 'target')) {
    return this.getCurrentItemFeedBack(label)
  }
}

/**
 *
 * @param item
 * @returns {*|null|Object}
 */
MatchQuestionCtrl.prototype.getDropFeedback = function getDropFeedback(item) {
  if (this.question.solutions) {
    for (let i = 0; i < this.question.solutions.length; i++) {
      if (item.source === this.question.solutions[i].firstId && item.target === this.question.solutions[i].secondId) {
        return this.question.solutions[i].feedback
      }
    }
  }
}

/**
 * Get the student's answers for this label
 * @param {type} label
 * @returns {Array}
 */
MatchQuestionCtrl.prototype.getStudentAnswers = function getStudentAnswers(label) {
  var answers_to_check
  if (this.question.toBind) {
    answers_to_check = this.connections
  } else {
    answers_to_check = this.dropped
  }

  var answers = []
  for (let i = 0; i < answers_to_check.length; i++) {
    if (answers_to_check[i].target === label.id) {
      for (let j = 0; j < this.question.firstSet.length; j++) {
        if (this.question.firstSet[j].id === answers_to_check[i].source) {
          answers.push(this.question.firstSet[j].data)
        }
      }
    }
  }

  return answers
}

/**
 * Get the student's answers for this label
 * @param {type} label
 * @returns {Array}
 */
MatchQuestionCtrl.prototype.getStudentAnswersWithIcons = function getStudentAnswersWithIcons(label) {
  var answers_to_check
  if (this.question.toBind) {
    answers_to_check = this.connections
  } else {
    answers_to_check = this.dropped
  }

  var answers = []
  for (let i = 0; i < answers_to_check.length; i++) {
    if (answers_to_check[i].target === label.id) {
      for (let j = 0; j < this.question.firstSet.length; j++) {
        if (this.question.firstSet[j].id === answers_to_check[i].source) {
          answers.push(this.question.firstSet[j].data)
        }
      }
    }
  }

  var correctAnswers = []

  if (this.question.solutions) {
    for (let i = 0; i < this.question.solutions.length; i++) {
      if (this.question.solutions[i].secondId === label.id) {
        for (let j = 0; j < this.question.firstSet.length; j++) {
          if (this.question.firstSet[j].id === this.question.solutions[i].firstId) {
            correctAnswers.push(this.question.firstSet[j].data)
          }
        }
      }
    }
  }

  for (let i = 0; i < answers.length; i++) {
    var selected = false
    for (let j = 0; j < correctAnswers.length; j++) {
      if (correctAnswers[j] === answers[i]) {
        answers[i] = answers[i] + ' <i class="feedback-icon fa fa-check color-success"></i>'
        selected = true
      }
    }
    if (!selected) {
      answers[i] = answers[i] + ' <i class="feedback-icon fa fa-close color-danger"></i>'
    }
  }

  return answers
}

/**
 *
 * @param proposalId
 * @param valueType
 * @returns {boolean}
 */
MatchQuestionCtrl.prototype.isRemovableItem = function isRemovableItem(proposalId, valueType) {
  if (this.feedback.visible) {
    return false
  }

  if (!this.feedback.enabled) {
    return true
  }

  if (this.question.solutions) {
    for (let i = 0; i < this.savedAnswers.length; i++) {
      if ((this.savedAnswers[i].target === proposalId && valueType === 'target') || (this.savedAnswers[i].source === proposalId && valueType === 'source')) {
        for (let j = 0; j < this.question.solutions.length; j++) {
          if (this.savedAnswers[i].source === this.question.solutions[j].firstId && this.savedAnswers[i].target === this.question.solutions[j].secondId) {
            return false
          }
        }
      }
    }
  }

  return true
}

/**
 *
 * @param proposal
 * @returns {boolean}
 */
MatchQuestionCtrl.prototype.proposalDropped = function proposalDropped(proposal) {
  for (let i = 0; i < this.dropped.length; i++) {
    if (this.dropped[i].source === proposal.id) {
      return true
    }
  }

  return false
}

/**
 * find all orphan answers and set them in an array
 */
MatchQuestionCtrl.prototype.setOrphanAnswers = function setOrphanAnswers() {
  var hasSolution
  for (let i = 0; i < this.question.secondSet.length; i++) {
    hasSolution = false
    for (let j=0; j < this.question.length; j++) {
      if (this.question.secondSet[i].id === this.solutions[j].secondId) {
        hasSolution = true
      }
    }
    if (!hasSolution) {
      this.orphanAnswers.push(this.question.secondSet[i])
    }
  }
}

/**
 *
 */
MatchQuestionCtrl.prototype.onFeedbackShow = function onFeedbackShow() {
  this.savedAnswers = []
  for (let i = 0; i < this.dropped.length; i++) {
    this.savedAnswers.push(this.dropped[i])
  }

  if (!this.question.toBind) {
    $('.draggable').draggable('disable')
    if (this.question.typeMatch !== 3) {
      $('.draggable').fadeTo(100, 0.3)
    }
  } else {
    this.colorBindings()
  }
}

/**
 *
 */
MatchQuestionCtrl.prototype.onFeedbackHide = function onFeedbackHide() {
  if (!this.question.toBind) {
    $('.draggable').draggable('enable')
    $('.draggable').fadeTo(100, 1)

    for (let i = 0; i < this.dropped.length; i++) {
      $('#draggable_' + this.dropped[i].source).draggable('disable')
      $('#draggable_' + this.dropped[i].source).fadeTo(100, 0.3)
    }
  } else {
    this.colorBindings()
  }
}

/**
 * Called on each jsPlumbConnectionEvent or jquery-ui drop event
 * also called at init
 * We need to share those informations with parent controllers
 * For that purpose we use a shared service
 */
MatchQuestionCtrl.prototype.updateStudentData = function () {
  // build answers
  this.answer.splice(0, this.answer.length)
  var answers_to_check
  if (this.question.toBind) {
    answers_to_check = this.connections
  } else {
    answers_to_check = this.dropped
  }

  for (let i = 0; i < answers_to_check.length; i++) {
    for (let j = 0; j < this.question.firstSet.length; j++) {
      for (let k = 0; k < this.question.secondSet.length; k++) {
        if (answers_to_check[i].source === this.question.firstSet[j].id && answers_to_check[i].target === this.question.secondSet[k].id) {
          var answer = answers_to_check[i].source + ',' + answers_to_check[i].target
          this.answer.push(answer)
        }
      }
    }
  }
}

/**
 * Only for toBind type
 * @returns {undefined}
 */
MatchQuestionCtrl.prototype.reset = function reset() {
  if (this.question.toBind) {
    jsPlumb.detachEveryConnection(this.element)
    this.connections.splice(0, this.connections.length)
  } else {
    // init all proposals ui
    $('.origin').each(function () {
      if ($(this).find('.draggable').attr('style')) {
        $(this).find('.draggable').removeAttr('style')
      }
      $(this).removeAttr('aria-disabled')
      $(this).draggable('enable')
    })

    // init all drop containers ui
    $('.droppable').each(function () {
      if ($(this).find('.dragDropped').children()) {
        $(this).removeClass('state-highlight')
        $(this).droppable( 'option', 'disabled', false)
        $(this).find('.dragDropped').children().remove()
      }
    })


    this.dropped.splice(0, this.dropped.length)
  }

  this.updateStudentData()
}

/**
 * Connect answer associations.
 */
MatchQuestionCtrl.prototype.addPreviousConnections = function addPreviousConnections() {
  if (this.answer && this.answer.length > 0) {
    for (let i = 0; i < this.answer.length; i++) {
      if (this.answer[i] && this.answer[i] !== '') {
        var association = this.answer[i].split(',')

        jsPlumb.connect({
          source: 'draggable_' + association[0],
          target: 'droppable_' + association[1],
          type: this.feedback.enabled
              && this.question.solutions
              && this.MatchQuestionService.isAssociationValid(this.question, association) ? 'right' : 'default'
        })

        var connection = {
          source: association[0],
          target: association[1]
        }

        this.connections.push(connection)
      }
    }
  }

  this.updateStudentData()
}

/**
 *
 */
MatchQuestionCtrl.prototype.addPreviousDroppedItems = function addPreviousDroppedItems() {
  this.dropped = []
  if (this.answer && this.answer.length > 0) {
    // init previously given answer
    var sets = this.answer
    for (let i = 0; i < sets.length; i++) {
      if (sets[i] && sets[i] !== '') {
        var items = sets[i].split(',')
        // disable corresponding draggable item
        if (this.question.typeMatch === 3) {
          $('#div_' + items[0]).draggable('disable')
        } else {
          $('#draggable_' + items[0]).draggable('disable')
        }
        // ui update
        if (this.question.typeMatch !== 3) {
          $('#draggable_' + items[0]).fadeTo(100, 0.3)
        }
        $('#droppable_' + items[1]).addClass('state-highlight')
        if (this.question.typeMatch === 3) {
          $('#droppable_' + items[1]).droppable( 'option', 'disabled', true )
        }
        var label = $('#draggable_' + items[0])[0].innerHTML
        var item = {
          source: items[0],
          target: items[1],
          label: label
        }
        this.dropped.push(item)
        this.savedAnswers.push(item)
      }
    }
  }

  this.updateStudentData()
}

/**
 * Only for toBind Match question
 * Each time a connection is done update student data
 * @param {type} data jsPlumb data
 * @returns {undefined}
 */
MatchQuestionCtrl.prototype.handleBeforeDrop = function handleBeforeDrop(data) {
  var jsPlumbConnection = jsPlumb.getConnections(data.connection)
  // avoid drawing the same connection multiple times
  if (jsPlumbConnection.length > 0 && data.sourceId === jsPlumbConnection[0].sourceId && data.targetId === jsPlumbConnection[0].targetId) {
    jsPlumb.detach(jsPlumbConnection)

    return false
  } else {
    var sourceId = data.sourceId.replace('draggable_', '')
    var targetId = data.targetId.replace('droppable_', '')
    for (let i=0; i<this.question.firstSet.length; i++) {
      if (this.question.firstSet[i].id === sourceId) {
        for (let j = 0; j < this.question.secondSet.length; j++) {
          if (this.question.secondSet[j].id === targetId) {
            var connection = {
              source: sourceId,
              target: targetId
            }
            this.connections.push(connection)
          }
        }
      }
    }
  }

  this.updateStudentData()

  return true
}

/**
 * Each time a connection is removed update student data
 * Only for toBind Match question
 * Remove one connection
 * @param {type} data
 * @returns {undefined}
 */
MatchQuestionCtrl.prototype.removeConnection = function removeConnection(connection) {
  if (connection._jsPlumb.hoverPaintStyle.strokeStyle === '#FC0000') {
    var sourceId = connection.sourceId.replace('draggable_', '')
    var targetId = connection.targetId.replace('droppable_', '')

    jsPlumb.detach(connection)

    for (let i = 0; i < this.connections.length; i++) {
      if (this.connections[i].source === sourceId && this.connections[i].target === targetId) {
        this.connections.splice(i, 1)
      }
    }

    this.updateStudentData()
  }
}

/**
 * Each time an item is drop we need to refresh data in DataSharing
 * Only for toDrag Match question
 * @returns {undefined}
 */
MatchQuestionCtrl.prototype.handleDragMatchQuestionDrop = function handleDragMatchQuestionDrop(event, ui) {
  // get dropped element id
  var sourceId = ui.draggable[0].id
  if (this.question.typeMatch === 3) {
    sourceId = sourceId.replace('div', 'draggable')
  }

  var label = ui.draggable[0].innerHTML
  if (this.question.typeMatch === 3) {
    label = $('#' + sourceId)[0].innerHTML
  }

  // get the container in which the element has been dropped
  var targetId = event.target.id

  // add the pair to the answer
  var entry = {
    source: sourceId.replace('draggable_', ''),
    target: targetId.replace('droppable_', ''),
    label: label
  }

  // ugly but... no choice ?
  this.$scope.$apply(function () {
    this.dropped.push(entry)
  }.bind(this))

  this.updateStudentData()

  // disable draggable element
  if (this.question.typeMatch === 3) {
    $('#' + sourceId.replace('draggable', 'div')).draggable('disable')
  } else {
    $('#' + sourceId).draggable('disable')
    $('#' + sourceId).fadeTo(100, 0.3)
  }
  // ui update
  $('#' + targetId).addClass('state-highlight')
  if (this.question.typeMatch === 3) {
    $('#' + targetId).droppable( 'option', 'disabled', true )
  }
}

/**
 * Each time an item is removed from drop container we need to refresh data in DataSharing
 * @param {type} sourceId
 * @param {type} targetId
 * @returns {undefined}
 */
MatchQuestionCtrl.prototype.removeDropped = function removeDropped(sourceId, targetId) {
  /**
   * HANDLE VALUES REMOVAL
   */
  var itemId
  var valueType
  if (targetId === -1) {
    itemId = sourceId
    valueType = 'source'
  } else {
    itemId = targetId
    valueType = 'target'
  }

  if ((this.isRemovableItem(itemId, valueType) && this.question.typeMatch === 3) || this.question.typeMatch !== 3) {
    /**
     * HANDLE VALUES REMOVAL
     */
    if (targetId !== -1) {
      // remove from local array (this.dropped)
      for (var i = 0; i < this.dropped.length; i++) {
        if (this.dropped[i].source === sourceId && this.dropped[i].target === targetId) {
          this.dropped.splice(i, 1)
        }
      }
      if (this.question.typeMatch === 3) {
        $('#div_' + sourceId).draggable('enable')
        $('#div_' + sourceId).fadeTo(100, 1)
      } else {
        // reactivate source draggable element
        $('#draggable_' + sourceId).draggable('enable')
        // visual changes for reactivated draggable element
        $('#draggable_' + sourceId).fadeTo(100, 1)
      }

      // ui update
      if ($('#droppable_' + targetId).find('.dragDropped').children().length <= 1) {
        $('#droppable_' + targetId).removeClass('state-highlight')
        $('#droppable_' + targetId).droppable( 'option', 'disabled', false )
      }

      // update student data
      this.updateStudentData()
    } else {
      // remove from local array (this.dropped)
      for (var j = 0; j < this.dropped.length; j++) {
        if (this.dropped[j].source === sourceId) {
          targetId = this.dropped[j].target
          this.dropped.splice(j, 1)
        }
      }
      $('#div_' + sourceId).draggable('enable')
      $('#div_' + sourceId).fadeTo(100, 1)

      // ui update
      if ($('#droppable_' + targetId).find('.dragDropped').children().length <= 1) {
        $('#droppable_' + targetId).removeClass('state-highlight')
        $('#droppable_' + targetId).droppable( 'option', 'disabled', false )
      }

      // update student data
      this.updateStudentData()
    }
  }
}

/* global jsPlumb */

import $ from 'jquery'
import 'jquery-ui/ui/draggable'
import 'jquery-ui/ui/droppable'

export default MatchQuestionCtrl
