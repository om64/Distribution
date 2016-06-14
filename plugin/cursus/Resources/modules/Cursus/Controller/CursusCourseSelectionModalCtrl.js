/*
 * This file is part of the Claroline Connect package.
 *
 * (c) Claroline Consortium <consortium@claroline.net>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

export default class CursusCourseSelectionModalCtrl {
  constructor($http, $uibModal, $uibModalInstance, CursusService, CourseService, cursusId, title) {
    this.$http = $http
    this.$uibModal = $uibModal
    this.$uibModalInstance = $uibModalInstance
    this.CursusService = CursusService
    this.CourseService = CourseService
    this.courses = CourseService.getCourses()
    this.cursusId = cursusId
    this.title = title
    this.searchInput = ''
    CourseService.loadCourses(this.cursusId)
  }

  isInitialized () {
    return this.CourseService.isInitialized()
  }

  getNbPagesArray () {
    return this.CourseService.getNbPagesArray()
  }

  getCurrentPage () {
    return this.CourseService.getCurrentPage()
  }

  getNbPages () {
    return this.CourseService.getNbPages()
  }

  getSearch () {
    return this.CourseService.getSearch()
  }


  loadPage (i) {
    if (i > 0 && i !== this.getCurrentPage() && i <= this.getNbPages()) {
      this.CourseService.loadPage(i)
    }
  }

  loadSearchedCourses () {
    if (this.searchInput !== this.CourseService.getSearch()) {
      this.CourseService.loadCourses(this.cursusId, this.searchInput)
    }
  }

  addCourseToCursus (courseId) {
    this.CursusService.addCourseToCursus(this.cursusId, courseId)
  }
}
