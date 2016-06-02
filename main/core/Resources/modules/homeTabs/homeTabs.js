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

import clarolineAPI from '../services/module'
import WidgetsModule from '../widgets/widgets'
import UserHomeTabCreationModalCtrl from './Controller/UserHomeTabCreationModalCtrl'
import UserHomeTabEditionModalCtrl from './Controller/UserHomeTabEditionModalCtrl'
import AdminHomeTabCreationModalCtrl from './Controller/AdminHomeTabCreationModalCtrl'
import AdminHomeTabEditionModalCtrl from './Controller/AdminHomeTabEditionModalCtrl'
import HomeTabService from './Service/HomeTabService'
import DesktopHomeTabsDirective from './Directive/DesktopHomeTabsDirective'
import AdminHomeTabsDirective from './Directive/AdminHomeTabsDirective'

//import Interceptors from '../interceptorsDefault'
//import HtmlTruster from '../html-truster/module'
//import bootstrap from 'angular-bootstrap'

angular.module('HomeTabsModule', [
  'ui.bootstrap',
  'ui.bootstrap.tpls',
  'colorpicker.module',
  'ui.translation',
  'ClarolineAPI',
  'WidgetsModule'
])
.controller('UserHomeTabCreationModalCtrl', UserHomeTabCreationModalCtrl)
.controller('UserHomeTabEditionModalCtrl', UserHomeTabEditionModalCtrl)
.controller('AdminHomeTabCreationModalCtrl', AdminHomeTabCreationModalCtrl)
.controller('AdminHomeTabEditionModalCtrl', AdminHomeTabEditionModalCtrl)
.service('HomeTabService', HomeTabService)
.directive('desktopHomeTabs', () => new DesktopHomeTabsDirective)
.directive('adminHomeTabs', () => new AdminHomeTabsDirective)