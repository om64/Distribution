import FeedbackService from './../../../feedback/Services/FeedbackService'

/**
 * Base directive configuration for all Question types
 * @param {FeedbackService} FeedbackService
 * @constructor
 */
function AbstractQuestionDirective(FeedbackService) {
  return {
    restrict: 'E',
    replace: true,
    bindToController: true,
    scope: {
      question : '=',
      answer   : '='
    },
    link: {
      post: function postLink(scope, element, attrs, controller) {
        if (FeedbackService.isVisible()) {
          controller.onFeedbackShow()
        }
      }
    }
  }
}

AbstractQuestionDirective.prototype.postLink = function link(scope, element, attrs, controller) {
  if (FeedbackService.isVisible()) {
    controller.onFeedbackShow()
  }
}

export default AbstractQuestionDirective
