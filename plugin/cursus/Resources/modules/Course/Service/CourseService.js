/*
 * This file is part of the Claroline Connect package.
 *
 * (c) Claroline Consortium <consortium@claroline.net>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

export default class CourseService {
  constructor ($http, $sce, $uibModal, ClarolineAPIService) {
    this.$http = $http
    this.$sce = $sce
    this.$uibModal = $uibModal
    this.courses = []
    this.initialized = false
    this.search = ''
    this.orderedBy = null
    this.order = null
    this.page = null
    this.max = null
    this.nbPages = 0
    this.currentCursusId = null,
    this.hasChanged = false
  }

  getCourses () {
    return this.courses
  }

  getNbPages () {
    return this.nbPages
  }

  getCurrentPage () {
    return this.page
  }

  getSearch () {
    return this.search
  }

  getMax () {
    return this.max
  }

  isInitialized () {
    return this.initialized
  }

  getNbPagesArray () {
    let pages = []

    for (let i = 1; i - 1 < this.nbPages; i++) {
      pages.push(i)
    }

    return pages
  }

  loadCourses (cursusId = null, search = '', orderedBy = 'title', order = 'ASC', page = 1, max = 20) {
    if (!this.hasChanged && this.currentCursusId === cursusId && this.search === search && this.orderedBy === orderedBy && this.order === order && this.page === page && this.max === max) {
      return null
    } else {
      this.initialized = false
      this.courses.splice(0, this.courses.length)
      let route

      if (cursusId) {
        route = search === '' ?
          Routing.generate('api_get_all_unmapped_courses', {cursus: cursusId, orderedBy: orderedBy, order: order, page: page, max: max}) :
          Routing.generate('api_get_searched_unmapped_courses', {cursus: cursusId, search: search, orderedBy: orderedBy, order: order, page: page, max: max})
      } else {
        route = search === '' ?
          Routing.generate('api_get_all_courses', {orderedBy: orderedBy, order: order, page: page, max: max}) :
          Routing.generate('api_get_searched_courses', {search: search, orderedBy: orderedBy, order: order, page: page, max: max})
      }

      return this.$http.get(route).then(d => {
        if (d['status'] === 200) {
          angular.merge(this.courses, d['data']['courses'])
          this.orderedBy = orderedBy
          this.order = order
          this.search = d['data']['search']
          this.page = d['data']['currentPage']
          this.max = d['data']['maxPerPage']
          this.nbPages = d['data']['nbPages']
          this.currentCursusId = cursusId
          this.initialized = true

          return 'initialized'
        }
      })
    }
  }

  loadPage(i) {
    this.loadCourses(this.currentCursusId, this.search, this.orderedBy, this.order, i, this.max)
  }

  removeCourse (courseId) {
    const index = this.courses.findIndex(c => c['id'] === courseId)

    if (index > -1) {
      this.courses.splice(index, 1)
      this.hasChanged = true
    }
  }
}