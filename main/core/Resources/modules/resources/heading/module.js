import 'angular/angular.min'

import HeaderDirective from './HeaderDirective'
import bootstrap from 'angular-bootstrap'
import Interceptors from '../../interceptorsDefault'

angular.module('ResourceHeading', ['ui.bootstrap'])
    .config(Interceptors)
    .directive('resourceHeading', () => new HeaderDirective)
