/**
 * Question module
 */

import 'angular-bootstrap'
import 'angular-ui-translation/angular-translation'
import 'ngBootbox'

import './../common/module'
import './../correction/module'
import './../image/module'

import QuestionShowCtrl from './Controllers/QuestionShowCtrl'
import ChoiceQuestionCtrl from './Controllers/Type/ChoiceQuestionCtrl'
import ClozeQuestionCtrl from './Controllers/Type/ClozeQuestionCtrl'
import GraphicQuestionCtrl from './Controllers/Type/GraphicQuestionCtrl'
import MatchQuestionCtrl from './Controllers/Type/MatchQuestionCtrl'
import OpenQuestionCtrl from './Controllers/Type/OpenQuestionCtrl'

import QuestionShowDirective from './Directives/QuestionShowDirective'
import ChoiceQuestionDirective from './Directives/Type/ChoiceQuestionDirective'
import ClozeQuestionDirective from './Directives/Type/ClozeQuestionDirective'
import GraphicQuestionDirective from './Directives/Type/GraphicQuestionDirective'
import MatchQuestionDirective from './Directives/Type/MatchQuestionDirective'
import OpenQuestionDirective from './Directives/Type/OpenQuestionDirective'

import QuestionService from './Services/QuestionService'
import ChoiceQuestionService from './Services/Type/ChoiceQuestionService'
import ClozeQuestionService from './Services/Type/ClozeQuestionService'
import GraphicQuestionService from './Services/Type/GraphicQuestionService'
import MatchQuestionService from './Services/Type/MatchQuestionService'
import OpenQuestionService from './Services/Type/OpenQuestionService'

angular
    .module('Question', [
        'ui.translation',
        'ui.bootstrap',
        'ngBootbox',
        'Common',
        'Image',
        'Correction'
    ])
    .controller('QuestionShowCtrl', [
        '$uibModal',
        'ExerciseService',
        'QuestionService',
        'FeedbackService',
        'UserPaperService',
        QuestionShowCtrl
    ])
    .controller('ChoiceQuestionCtrl', [
        'FeedbackService',
        'ChoiceQuestionService',
        ChoiceQuestionCtrl
    ])
    .controller('ClozeQuestionCtrl', [
        'FeedbackService',
        'ClozeQuestionService',
        ClozeQuestionCtrl
    ])
    .controller('GraphicQuestionCtrl', [
        'FeedbackService',
        'GraphicQuestionService',
        'ImageAreaService',
        GraphicQuestionCtrl
    ])
    .controller('MatchQuestionCtrl', [
        'FeedbackService',
        '$scope',
        'MatchQuestionService',
        MatchQuestionCtrl
    ])
    .controller('OpenQuestionCtrl', [
        'FeedbackService',
        'OpenQuestionService',
        OpenQuestionCtrl
    ])
    .directive('questionShow', [
        QuestionShowDirective
    ])
    .directive('choiceQuestion', [
        'FeedbackService',
        ChoiceQuestionDirective
    ])
    .directive('clozeQuestion', [
        'FeedbackService',
        '$compile',
        ClozeQuestionDirective
    ])
    .directive('graphicQuestion', [
        'FeedbackService',
        '$window',
        GraphicQuestionDirective
    ])
    .directive('matchQuestion', [
        'FeedbackService',
        '$timeout',
        'MatchQuestionService',
        MatchQuestionDirective
    ])
    .directive('openQuestion', [
        'FeedbackService',
        OpenQuestionDirective
    ])
    .service('QuestionService', [
        'ChoiceQuestionService',
        'ClozeQuestionService',
        'GraphicQuestionService',
        'MatchQuestionService',
        'OpenQuestionService',
        QuestionService
    ])
    .service('ChoiceQuestionService', [
        'FeedbackService',
        ChoiceQuestionService
    ])
    .service('ClozeQuestionService', [
        'FeedbackService',
        ClozeQuestionService
    ])
    .service('GraphicQuestionService', [
        'FeedbackService',
        'ImageAreaService',
        GraphicQuestionService
    ])
    .service('MatchQuestionService', [
        'FeedbackService',
        MatchQuestionService
    ])
    .service('OpenQuestionService', [
        'FeedbackService',
        OpenQuestionService
    ])
