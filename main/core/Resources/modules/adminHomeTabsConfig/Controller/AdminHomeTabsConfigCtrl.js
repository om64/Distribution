/*
 * This file is part of the Claroline Connect package.
 *
 * (c) Claroline Consortium <consortium@claroline.net>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

export default class AdminHomeTabsConfigCtrl {

  constructor($http, HomeTabService, WidgetService) {
    this.$http = $http
    this.HomeTabService = HomeTabService
    this.WidgetService = WidgetService
    this.adminHomeTabs = HomeTabService.getAdminHomeTabs()
    //this.userHomeTabs = HomeTabService.getUserHomeTabs()
    //this.workspaceHomeTabs = HomeTabService.getWorkspaceHomeTabs()
    this.homeTabsOptions = HomeTabService.getOptions()
    //this.widgets = WidgetService.getWidgets()
    //this.widgetsOptions = WidgetService.getOptions()
    //this.widgetsDisplayOptions = WidgetService.getWidgetsDisplayOptions()
    //this.editionMode = false
    //this.isHomeLocked = true
    this.gridsterOptions = WidgetService.getGridsterOptions()
    this.initialize()
    this.initializeDragAndDrop()
  }

  initialize() {
    this.HomeTabService.loadAdminHomeTabs()
    //const route = Routing.generate('api_get_desktop_options')
    //this.$http.get(route).then(datas => {
    //  if (datas['status'] === 200) {
    //    this.isHomeLocked = datas['data']['isHomeLocked']
    //    this.editionMode = datas['data']['editionMode']
    //    this.homeTabsOptions['canEdit'] = !this.isHomeLocked && this.editionMode
    //    this.HomeTabService.loadDesktopHomeTabs()
    //  }
    //})
  }

  initializeDragAndDrop () {
    angular.element('#admin-home-tabs-list').sortable({
      items: '.home-tab',
      cursor: 'move'
    })

    angular.element('#admin-home-tabs-list').on('sortupdate', (event, ui) => {
      const hcId = $(ui.item).data('hometab-config-id')
      let nextHcId = -1
      const nextElement = $(ui.item).next()

      if (nextElement !== undefined && nextElement.hasClass('home-tab')) {
        nextHcId = nextElement.data('hometab-config-id')
      }
      const route = Routing.generate(
        'api_post_admin_home_tab_config_reorder',
        {homeTabConfig: hcId, nextHomeTabConfigId: nextHcId, homeTabType: 'desktop'}
      )
      this.$http.post(route)
    })
  }

  showTab(tabId, tabConfigId) {
    this.homeTabsOptions['selectedTabId'] = tabId
    this.homeTabsOptions['selectedTabConfigId'] = tabConfigId
    //this.WidgetService.loadAdminHomeTabs(tabId)
  }

  createAdminHomeTab() {
    this.HomeTabService.createAdminHomeTab()
  }

  editAdminHomeTab($event, tabConfigId) {
    $event.stopPropagation()
    this.HomeTabService.editAdminHomeTab(tabConfigId)
  }

  deleteAdminHomeTab($event, tabConfigId) {
    $event.stopPropagation()
    this.HomeTabService.deleteAdminHomeTab(tabConfigId)
  }
}