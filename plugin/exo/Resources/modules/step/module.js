/**
 * Step module
 */

import angular from "angular/index"
import registerDragula from "angular-dragula/dist/angular-dragula"

import 'angular-bootstrap'
import 'angular-ui-translation/angular-translation'
import 'angular-ui-tinymce'
import '#/main/core/modal/module'

import './../common/module'
import './../question/module'

import StepService from './Services/StepService'
import StepListCtrl from './Controllers/StepListCtrl'
import StepMetadataCtrl from './Controllers/StepMetadataCtrl'
import StepShowCtrl from './Controllers/StepShowCtrl'
import StepShowDirective from './Directives/StepShowDirective'

registerDragula(angular)

angular
  .module('Step', [
    'ui.translation',
    'ui.bootstrap',
    'ui.tinymce',
    'ui.modal',
    'dragula',
    'Common',
    'Question'
  ])
  .service('StepService', [
    '$http',
    '$q',
    'ExerciseService',
    'QuestionService',
    StepService
  ])
  .controller('StepListCtrl', [
    '$scope',
    '$uibModal',
    'dragulaService',
    'ExerciseService',
    'StepService',
    StepListCtrl
  ])
  .controller('StepMetadataCtrl', [
    'step',
    '$uibModalInstance',
    'TinyMceService',
    'StepService',
    StepMetadataCtrl
  ])
  .controller('StepShowCtrl', [
    'UserPaperService',
    'FeedbackService',
    'QuestionService',
    StepShowCtrl
  ])
  .directive('stepShow', StepShowDirective)
