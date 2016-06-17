/**
 * Match Question Directive
 * Manages Question of types Match
 *
 * @param {FeedbackService}      FeedbackService
 * @param {Function}             $timeout
 * @param {Object}               $window
 * @param {MatchQuestionService} MatchQuestionService
 * @returns {Object}
 * @constructor
 */
var MatchQuestionDirective = function MatchQuestionDirective(FeedbackService, $timeout, $window, MatchQuestionService) {
    return angular.merge({}, AbstractQuestionDirective.apply(this, arguments), {
        controller: 'MatchQuestionCtrl',
        controllerAs: 'matchQuestionCtrl',
        templateUrl: AngularApp.webDir + 'bundles/ujmexo/js/angular/Question/Partials/Type/match.html',
        link: {
            post: function postLink(scope, element, attr, controller) {
                // init jsPlumb dom elements
                $timeout(function () {
                    // MatchQuestion sub type is ToBind
                    if (controller.question.toBind) {
                        MatchQuestionService.initBindMatchQuestion(element);

                        jsPlumb.bind('beforeDrop', function (info) {
                            return controller.handleBeforeDrop(info);
                        });

                        // remove one connection
                        jsPlumb.bind("click", function (connection) {
                            if (connection._jsPlumb.hoverPaintStyle.strokeStyle === "#FC0000") {
                                controller.removeConnection(connection);
                            }
                        });

                        controller.addPreviousConnections();
                    } else {
                        MatchQuestionService.initDragMatchQuestion();

                        $(".droppable").each(function () {
                            $(this).on("drop", function (event, ui) {
                                controller.handleDragMatchQuestionDrop(event, ui);
                            });
                        });

                        if (controller.question.typeMatch === 3) {
                            $(".draggable").each(function () {
                                var id = $(this)[0].id.replace("div", "drag_handle");
                                $(this).draggable({
                                    handle: "#" + id
                                });
                            });
                        }

                        controller.addPreviousDroppedItems();
                    }

                    // Manually show feedback (as we override the default postLink method)
                    if (FeedbackService.isVisible()) {
                        controller.onFeedbackShow();
                    }
                }.bind(this));

                // Redraw connections if the browser is resized
                angular.element($window).on('resize', function () {
                    jsPlumb.repaintEverything();
                });

                // On directive destroy, remove events
                scope.$on('$destroy', function handleDestroyEvent() {
                    // TODO : remove drag'n'drop events
                    jsPlumb.detachEveryConnection();
                    jsPlumb.deleteEveryEndpoint();
                });
            }
        }
    });
};

// Extends AbstractQuestionDirective
MatchQuestionDirective.prototype = Object.create(AbstractQuestionDirective.prototype);

// Set up dependency injection (get DI from parent too)
MatchQuestionDirective.$inject = AbstractQuestionDirective.$inject.concat([ '$timeout', '$window', 'MatchQuestionService' ]);

// Register directive into AngularJS
angular
    .module('Question')
    .directive('matchQuestion', MatchQuestionDirective);
