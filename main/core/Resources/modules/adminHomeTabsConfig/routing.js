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
    .state ('config', {
      url: '/config',
      template: require('./Partial/config.html'),
      controller: 'AdminHomeTabsConfigCtrl',
      controllerAs: 'ahtcc'
    })

  $urlRouterProvider.otherwise('/config')
}
