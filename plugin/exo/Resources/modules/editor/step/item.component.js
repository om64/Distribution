import angular from 'angular/index'
import {controller} from './../store'
import template from './item.component.html'

angular
  .module('editor')
  .component('item', {
    template: ['$element', '$attrs', function ($el, $attrs) {
      console.log('el', $el)
      console.log('attrs', $attrs)

      return 'Dyn item tpl'
    }],
    controller,
    bindings: {
      data: '<'
    }
  })
