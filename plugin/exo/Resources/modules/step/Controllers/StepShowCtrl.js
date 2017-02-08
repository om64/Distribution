/**
 * Step Show Controller
 * @param {UserPaperService} UserPaperService
 * @param {FeedbackService} FeedbackService
 * @param {QuestionService} QuestionService
 * @param {StepService} StepService
 * @constructor
 */
function StepShowCtrl(UserPaperService, FeedbackService, QuestionService, StepService) {
  this.UserPaperService = UserPaperService
  this.FeedbackService = FeedbackService
  this.QuestionService = QuestionService
  this.StepService = StepService

  // Get feedback info
  this.feedback = this.FeedbackService.get()

  this.FeedbackService
            .on('show', this.onFeedbackShow.bind(this))

  if (!this.solutionShown && this.feedback.enabled && this.items[0]) {
    const questionPaper = this.getQuestionPaper(this.items[0])
    if (questionPaper.nbTries) {
      this.FeedbackService.show()

      if (questionPaper.nbTries >= this.step.meta.maxAttempts || this.FeedbackService.SOLUTION_FOUND === this.allAnswersFound) {
        // Show correction if the User has done all is attempts or if his answer is correct
        this.solutionShown = true
      }
    }
  }

  this.showScore = this.UserPaperService.isScoreAvailable(this.UserPaperService.getPaper())
}

/**
 * Current step
 * @type {Object}
 */
StepShowCtrl.prototype.step = null

/**
 * Current feedback
 * @type {Object}
 */
StepShowCtrl.prototype.feedback = null

/**
 * Items of the Step (correctly ordered)
 * @type {Array}
 */
StepShowCtrl.prototype.items = []

/**
 * Current step number
 * @type {Object}
 */
StepShowCtrl.prototype.position = 0

/**
 *
 * @type {boolean}
 */
StepShowCtrl.prototype.solutionShown = false

/**
 *
 * @type {Integer}
 */
StepShowCtrl.prototype.allAnswersFound = -1

/**
 *
 * @type {boolean}
 */
StepShowCtrl.prototype.showScore = true

/**
 *
 * @type {boolean}
 */
StepShowCtrl.prototype.stepNeedsManualCorrection = false

/**
 * Get the Paper related to the Question
 * @param   {Object} question
 * @returns {Object}
 */
StepShowCtrl.prototype.getQuestionPaper = function getQuestionPaper(question) {
  return this.UserPaperService.getQuestionPaper(question)
}

/**
 * Get step total available score and step current score
 */
StepShowCtrl.prototype.getStepAvailablePoints = function getStepAvailablePoints() {
  if (this.items) {
    for (const question of this.items) {
      this.stepAvailablePoints += this.QuestionService.getTypeService(question.type).getTotalScore(question)
    }
  }
}

/**
 * Get step total available score and step current score
 */
StepShowCtrl.prototype.getStepScores = function getStepScores() {
  let availablePoints = 0
  let stepScore = 0
  let nbWithoutScore = 0
  if(this.items){
    for (const question of this.items) {
      availablePoints += this.QuestionService.getTypeService(question.type).getTotalScore(question)
      const questionPaper = this.getQuestionPaper(question)
      let score = this.QuestionService.calculateScore(question, questionPaper)
      // if question of type open long with no score
      if(score !== -1){
        stepScore += score
      } else {
        this.stepNeedsManualCorrection = true
        ++nbWithoutScore
      }
    }
    stepScore = nbWithoutScore === this.items.length ? '?' : stepScore
  }

  return stepScore + '/' + availablePoints
}

/**
 * On Feedback Show
 */
StepShowCtrl.prototype.onFeedbackShow = function onFeedbackShow() {

  this.allAnswersFound = this.FeedbackService.SOLUTION_FOUND

  if(this.items){
    for (const question of this.items) {
      const userPaper = this.getQuestionPaper(question)
      const answer = userPaper.answer

      this.feedback.state[question.id] = this.QuestionService.getTypeService(question.type).answersAllFound(question, answer)
      if (this.feedback.state[question.id] !== 0) {
        this.allAnswersFound = this.FeedbackService.MULTIPLE_ANSWERS_MISSING
      }
    }
  }
}

StepShowCtrl.prototype.showMinimalCorrection = function showMinimalCorrection() {
  return this.StepService.getExerciseMeta().minimalCorrection
}

/**
 *
 * @returns {string} Get the suite feedback sentence
 */
StepShowCtrl.prototype.getSuiteFeedback = function getSuiteFeedback() {
  var sentence = ''
  if (this.allAnswersFound === this.FeedbackService.SOLUTION_FOUND) {
    // Toutes les réponses ont été trouvées
    if (this.items.length === 1) {
      // L'étape comporte une seule question
      if (this.currentTry === 1) {
        // On en est à l'essai 1
        sentence = 'perfectly_correct'
      } else {
        // L'étape a été jouée plusieurs fois
        sentence = 'answers_correct'
      }
    } else {
      // L'étape comporte plusieurs questions
      if (this.currentTry === 1) {
        sentence = 'all_answers_found'
      } else {
        sentence = 'answers_now_correct'
      }
    }
  } else if (this.allAnswersFound === this.FeedbackService.MULTIPLE_ANSWERS_MISSING) {
    // toutes les réponses n'ont pas été trouvées
    if (this.currentTry < this.step.meta.maxAttempts) {
      sentence = 'some_answers_miss_try_again'
    } else {
      if (this.step.maxAttempts !== 0) {
        if (this.StepService.getExerciseMeta().minimalCorrection === false) {
          sentence = 'max_attempts_reached_see_solution'
        } else {
          sentence = 'max_attempts_reached_continue'
        }
      }
    }
  }

  return sentence
}

export default StepShowCtrl
