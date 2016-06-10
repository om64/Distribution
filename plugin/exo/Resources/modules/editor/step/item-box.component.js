import angular from 'angular/index'
import {controller} from './../store'
import template from './item-box.component.html'

angular
  .module('editor')
  .component('itemBox', {
    template,
    controller,
    bindings: {
      item: '<'
    }
  })
