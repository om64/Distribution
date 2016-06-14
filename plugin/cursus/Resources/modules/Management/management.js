/*
 * This file is part of the Claroline Connect package.
 *
 * (c) Claroline Consortium <consortium@claroline.net>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import 'angular/angular.min'

import UIRouter from 'angular-ui-router'
import dataTable from 'angular-data-table/release/dataTable.helpers.min'
import bootstrap from 'angular-bootstrap'
import translation from 'angular-ui-translation/angular-translation'
import breadcrumbs from 'angular-breadcrumb'
import loading from 'angular-loading-bar'

import '../../../../../main/core/Resources/modules/fos-js-router/module'
import CursusModule from '../Cursus/cursus'
import CourseModule from '../Course/course'
import SessionModule from '../Session/session'

import Routing from './routing.js'
import RootCursusManagementCtrl from './Controller/RootCursusManagementCtrl'
import CursusManagementCtrl from './Controller/CursusManagementCtrl'

angular.module('CursusManagementModule', [
  'ui.router',
  'ui.translation',
  'data-table',
  'ui.bootstrap',
  'ui.bootstrap.tpls',
  'ncy-angular-breadcrumb',
  'angular-loading-bar',
  'ui.fos-js-router',
  'CursusModule',
  'CourseModule',
  'SessionModule'
])
.controller('RootCursusManagementCtrl', ['$http', 'CursusService', 'CourseService', RootCursusManagementCtrl])
.controller('CursusManagementCtrl', ['$stateParams', '$http', 'CursusService', 'CourseService', CursusManagementCtrl])
.config(Routing)
.config([
  'cfpLoadingBarProvider',
  function configureLoadingBar (cfpLoadingBarProvider) {
    // Configure loader
    cfpLoadingBarProvider.latencyThreshold = 200
    cfpLoadingBarProvider.includeBar = true
    cfpLoadingBarProvider.includeSpinner = true
    //cfpLoadingBarProvider.spinnerTemplate = '<div class="loading">Loading&#8230;</div>';
  }
])