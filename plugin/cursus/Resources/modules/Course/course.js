/*
 * This file is part of the Claroline Connect package.
 *
 * (c) Claroline Consortium <consortium@claroline.net>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import 'angular/index'

import bootstrap from 'angular-bootstrap'
import colorpicker from 'angular-bootstrap-colorpicker'
import translation from 'angular-ui-translation/angular-translation'

import clarolineAPI from '../../../../../main/core/Resources/modules/services/module'
import CourseService from './Service/CourseService'

angular.module('CourseModule', [
  'ui.bootstrap',
  'ui.bootstrap.tpls',
  'colorpicker.module',
  'ui.translation',
  'ClarolineAPI'
])
.service('CourseService', CourseService)