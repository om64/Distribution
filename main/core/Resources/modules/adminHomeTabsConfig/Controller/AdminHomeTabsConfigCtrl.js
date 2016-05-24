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
    //this.initializeDragAndDrop()
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

  showTab(tabId, tabConfigId) {
    this.homeTabsOptions['selectedTabId'] = tabId
    this.homeTabsOptions['selectedTabConfigId'] = tabConfigId
    //this.WidgetService.loadAdminHomeTabs(tabId)
  }
}