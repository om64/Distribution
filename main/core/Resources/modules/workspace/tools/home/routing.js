/*
 * This file is part of the Claroline Connect package.
 *
 * (c) Claroline Consortium <consortium@claroline.net>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

export default function($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state ('home', {
      url: '/home',
      template: require('./Partial/home.html'),
      controller: 'WorkspaceHomeCtrl',
      controllerAs: 'whc'
    })

  $urlRouterProvider.otherwise('/home')
}
