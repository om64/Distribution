/*
 * This file is part of the Claroline Connect package.
 *
 * (c) Claroline Consortium <consortium@claroline.net>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

export default class SessionService {
  constructor ($http, $sce, $uibModal) {
    this.$http = $http
    this.$sce = $sce
    this.$uibModal = $uibModal
    this.sessions = []
  }

  getSessions () {
    return this.sessions
  }

  initialize () {

  }
}