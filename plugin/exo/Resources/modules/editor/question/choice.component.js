import angular from 'angular/index'
import {controller} from './../store'
import template from './choice.component.html'

angular
  .module('editor')
  .component('step', {
    template,
    controller,
    bindings: {
      question: '<'
    }
  })
