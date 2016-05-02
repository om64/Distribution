import HeaderController from './HeaderController'

export default class ClarolineSearchDirective {
  constructor () {
    this.scope = {}
    this.restrict = 'E'
    this.template = require('./header.html')
    this.replace = false
    this.controller = HeaderController
    this.controllerAs = 'rhc'
  }
}
