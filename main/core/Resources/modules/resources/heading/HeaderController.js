export default class HeaderController {
  constructor ($http, $uibModal) {
    this.$http = $http
    this.$uibModal = $uibModal
    this.resourceNodeId = HeaderController._getGlobal('resourceNodeId')
  }

  onNotify() {
      alert('notify')
  }

  onTag() {
      alert('tag')
  }

  onFavourite() {
      alert('favourite')
  }

  onSearch() {
      alert('search')
  }

  onAnnotate() {
      alert('annotate')
  }

  onLike() {
      alert('like')
  }

  onComment() {
      this.startFormCustomAction('note_action')
  }

  startFormCustomAction(action)
  {
      const route = Routing.generate('claro_resource_action', {action: action, node: this.resourceNodeId})

      this.$http.get(route).then(d => {
          //here we need to remove the root element (it's already provided)
          const modalInstance = this.$uibModal.open({
              template: angular.element(d.data).children().first()
          })
      })
  }

  static _getGlobal (name) {
    if (typeof window[name] === 'undefined') {
      throw new Error(
        `Expected ${name} to be exposed in a window.${name} variable`
      )
    }

    return window[name]
  }
}
