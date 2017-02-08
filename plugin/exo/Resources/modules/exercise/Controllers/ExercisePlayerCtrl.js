/**
 * Exercise Player Controller
 * Plays and registers answers to an Exercise
 *
 * @param {Object}           $location
 * @param {Object}           step
 * @param {Object}           attempt
 * @param {ExerciseService}  ExerciseService
 * @param {FeedbackService}  FeedbackService
 * @param {UserPaperService} UserPaperService
 * @param {TimerService}     TimerService
 * @constructor
 */
function ExercisePlayerCtrl(
        $location,
        step,
        attempt,
        ExerciseService,
        FeedbackService,
        UserPaperService,
        TimerService
        ) {
  // Store services
  this.$location = $location
  this.ExerciseService = ExerciseService
  this.FeedbackService = FeedbackService
  this.UserPaperService = UserPaperService
  this.TimerService = TimerService

  // Initialize some data
  this.exercise = this.ExerciseService.getExercise() // Current exercise
  this.paper = attempt.paper    // Paper of the current User
  this.questions = attempt.questions

  if (!step && this.paper.order.length > 0) {
    // No step passed to the route => Get the first Step defined in the UserPaper
    step = this.ExerciseService.getStep(this.paper.order[0].id)
  }

  this.step = step
  if (this.step) {
    this.stepQuestions = this.orderStepQuestions()
  }

  this.index = this.UserPaperService.getIndex(step)
  this.previous = this.UserPaperService.getPreviousStep(step)
  this.next = this.UserPaperService.getNextStep(step)

  this.allAnswersFound = -1

  // Reset feedback (hide feedback and reset registered callbacks of the Step)
  this.FeedbackService.reset()

  // Configure Feedback
  if (this.ExerciseService.TYPE_FORMATIVE === this.exercise.meta.type) {
    // Enable feedback
    this.FeedbackService.enable()
  } else {
    // Disable feedback
    this.FeedbackService.disable()
  }

  // Get feedback info
  this.feedback = this.FeedbackService.get()

  this.areMaxAttemptsReached()

  // Initialize Timer if needed
  if (!isNaN(Number(this.exercise.meta.duration)) && 0 !== Number(this.exercise.meta.duration)) {
    this.timer = this.TimerService.new(this.exercise.id, Number(this.exercise.meta.duration) * 60, this.end.bind(this), true)
  }

  if (this.step && this.step.items[0]) {
    const questionPaper = this.UserPaperService.getQuestionPaper(this.step.items[0])
    if (questionPaper.nbTries) {
      this.currentStepTry = questionPaper.nbTries
    }
  }
}

/**
 * Current played Exercise
 * @type {Object}
 */
ExercisePlayerCtrl.prototype.exercise = {}

/**
 * Current User paper
 * @type {Object}
 */
ExercisePlayerCtrl.prototype.paper = {}

/**
 * Feedback information
 * @type {Object}
 */
ExercisePlayerCtrl.prototype.feedback = null

/**
 * Current step index
 * @type {number}
 */
ExercisePlayerCtrl.prototype.index = 0

/**
 * Current played step
 * @type {Object}
 */
ExercisePlayerCtrl.prototype.step = null

/**
 * Questions for the current Step
 * @type {array}
 */
ExercisePlayerCtrl.prototype.stepQuestions = []

/**
 * Previous step
 * @type {Object}
 */
ExercisePlayerCtrl.prototype.previous = null

/**
 * Next step
 * @type {Object}
 */
ExercisePlayerCtrl.prototype.next = null

/**
 * Is the current Step answers submitted ?
 * @type {Boolean}
 */
ExercisePlayerCtrl.prototype.submitted = false

/**
 * Are the solutions shown in the Exercise ?
 * @type {boolean}
 */
ExercisePlayerCtrl.prototype.solutionShown = false

/**
 *
 * @type {number}
 */
ExercisePlayerCtrl.prototype.currentStepTry = 1

/**
 * Timer of the Exercise
 * @type {Object|null}
 */
ExercisePlayerCtrl.prototype.timer = null

ExercisePlayerCtrl.prototype.orderStepQuestions = function () {
  return this.UserPaperService.orderStepQuestions(this.step)
}

/**
 * Submit answers for the current Step
 */
ExercisePlayerCtrl.prototype.submit = function submit() {
  return this.UserPaperService
          .submitStep(this.step)
          .then(function onSuccess(response) {
            if (response) {
              // Answers have been submitted
              this.submitted = true

              if (this.FeedbackService.isEnabled()) {
                // Show feedback
                this.FeedbackService.show()
              }
            }
          }.bind(this))
}

/**
 * Check if the step's maxAttempts is reached
 */
ExercisePlayerCtrl.prototype.areMaxAttemptsReached = function areMaxAttemptsReached() {
  if (this.feedback.enabled && this.step.meta.maxAttempts !== 0) {
    for (var i = 0; i < this.paper.questions.length; i++) {
      if (this.step.items[0].id.toString() === this.paper.questions[i].id.toString() && this.paper.questions[i].nbTries >= this.step.meta.maxAttempts) {
        this.feedback.visible = true
        this.solutionShown = true
        this.currentStepTry = this.paper.questions[i].nbTries
        if (this.currentStepTry > this.step.meta.maxAttempts) {
          this.currentStepTry = this.step.meta.maxAttempts
        }
      }
    }
  }
}

/**
 * @param button
 */
ExercisePlayerCtrl.prototype.isButtonEnabled = function isButtonEnabled(button) {
  var buttonEnabled

  var isFormative = this.feedback.enabled
  var feedbackShown = this.feedback.visible
  var allAnswersFound = this.allAnswersFound === 0
  var maxStepReached = this.currentStepTry >= this.step.meta.maxAttempts
  var minimalCorrection = this.exercise.meta.minimalCorrection

  var navigateOneStep = isFormative && !allAnswersFound && (!feedbackShown || (feedbackShown && (!maxStepReached || (maxStepReached && !minimalCorrection && !this.solutionShown))))

  if (button === 'retry') {
    buttonEnabled = isFormative && feedbackShown && (this.currentStepTry < this.step.meta.maxAttempts || this.step.meta.maxAttempts === 0) && !allAnswersFound
  } else if (button === 'next') {
    buttonEnabled = !this.next || navigateOneStep
  } else if (button === 'navigation') {
    buttonEnabled = (isFormative && !feedbackShown) || (isFormative && feedbackShown && !this.solutionShown && !allAnswersFound)
  } else if (button === 'end') {
    buttonEnabled = navigateOneStep
  } else if (button === 'validate') {
    buttonEnabled = isFormative && !feedbackShown && (this.currentStepTry <= this.step.meta.maxAttempts || this.step.meta.maxAttempts === 0) && !allAnswersFound
  } else if (button === 'previous') {
    buttonEnabled = !this.previous || navigateOneStep
  }

  return buttonEnabled
}

/**
 * Retry the current Step
 */
ExercisePlayerCtrl.prototype.retry = function retry() {
  this.submitted = false
  this.currentStepTry++

  if (this.FeedbackService.isEnabled()) {
    // Hide feedback
    this.FeedbackService.hide()
  }
}

/**
 * Show the solution
 */
ExercisePlayerCtrl.prototype.showSolution = function showSolution() {
  this.solutionShown = true
}

/**
 * Navigate to a step
 * @param step
 */
ExercisePlayerCtrl.prototype.goTo = function goTo(step) {
  // Manually disable tooltip
  $('.tooltip').hide()

  if (!this.submitted) {
    // Answers for the current step have not been submitted => submit it before navigating
    this.submit()
            .then(function onSuccess() {
              this.submitted = false
              this.solutionShown = false

              this.$location.path('/play/' + step.id)
            }.bind(this))
  } else {
    // Directly navigate to the Step
    this.submitted = false
    this.solutionShown = false

    this.$location.path('/play/' + step.id)
  }

  this.areMaxAttemptsReached()
}

/**
 * End the Exercise
 * Saves the current step and go to the Exercise home or papers if correction is available
 */
ExercisePlayerCtrl.prototype.end = function end() {
  if (this.timer) {
    // Stop Timer if the Exercise as a fixed duration
    this.TimerService.destroy(this.timer.id)
  }

  this
    .submit()
    .then(function onSuccess() {
      // Answers submitted, we can now end the Exercise
      this.UserPaperService
        .end()
        .then(function onSuccess() {
          if (this.UserPaperService.isCorrectionAvailable(this.paper)) {
            // go to paper correction view
            this.$location.path('/papers/' + this.paper.id)
          }
          else {
            // go to exercise papers list (to let the User show his registered paper)
            this.$location.path('/')
          }
        }.bind(this))
      this.feedback.state = {}
    }.bind(this))
}

/**
 * Interrupt the Exercise
 * Saves the current step and go to the Exercise home
 */
ExercisePlayerCtrl.prototype.interrupt = function interrupt() {
  if (this.timer) {
    // Stop Timer if the Exercise as a fixed duration
    this.TimerService.destroy(this.timer.id)
  }

  this.submit()
          .then(function onSuccess() {
            // Return to exercise home
            this.$location.path('/')
          }.bind(this))
}

import $ from 'jquery'

export default ExercisePlayerCtrl
