import angular from 'angular/index'
import {controller} from './../store'
import template from './step.component.html'

angular
  .module('editor')
  .component('step', {
    template,
    controller,
    bindings: {
      id: '<',
      items: '<',
      meta: '<',
      index: '<'
    }
  })
