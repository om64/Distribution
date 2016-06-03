/*
 * This file is part of the Claroline Connect package.
 *
 * (c) Claroline Consortium <consortium@claroline.net>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

export default class WidgetService {
  constructor ($http, $sce, $uibModal, ClarolineAPIService) {
    this.$http = $http
    this.$sce = $sce
    this.$uibModal = $uibModal
    this.ClarolineAPIService = ClarolineAPIService
    this.widgets = []
    this.options = {
      canEdit: false
    }
    this.type = 'desktop';
    this.widgetsDisplayOptions = {}
    this.widgetHasChanged = false
    this.gridsterOptions = {
      columns: 12,
      floating: true,
      resizable: {
        enabled: false,
        handles: ['ne', 'se', 'sw', 'nw'],
        start: (event, $element, widget) => {},
        resize: (event, $element, widget) => {
          this.widgetHasChanged = true
        },
        stop: (event, $element, widget) => {
          if (this.widgetHasChanged) {
            this.widgetHasChanged = false
            this._updateWidgetsDisplay()
          }
        }
      },
      draggable: {
        enabled: false,
        handle: '.widget-header',
        start: (event, $element, widget) => {},
        drag: (event, $element, widget) => {
          this.widgetHasChanged = true
        },
        stop: (event, $element, widget) => {
          if (this.widgetHasChanged) {
            this.widgetHasChanged = false
            this._updateWidgetsDisplay()
          }
        }
      }
    }
    this._addWidgetCallback = this._addWidgetCallback.bind(this)
    this._updateWidgetsDisplay = this._updateWidgetsDisplay.bind(this)
    this._removeWidgetCallback = this._removeWidgetCallback.bind(this)
  }

  _addWidgetCallback (data) {
    this.widgetsDisplayOptions[data['displayId']] = {
      id: data['displayId'],
      row: data['row'],
      col: data['col'],
      sizeX: data['sizeX'],
      sizeY: data['sizeY']
    }
    this.widgets.push(data)
    this.loadWidgetContent(data['instanceId'])
    this._updateWidgetsDisplay()
  }

  _updateWidgetsDisplay () {
    if (this.type === 'desktop') {
      this.checkDesktopWidgetsDisplayOptions()
    } else if (this.type === 'admin') {
      this.checkAdminWidgetsDisplayOptions()
    }
  }

  _removeWidgetCallback (data) {
    if (data['id']) {
      const index = this.widgets.findIndex(w => data['id'] === w['instanceId'])

      if (index > -1) {
        this.widgets.splice(index, 1)
      }
      this._updateWidgetsDisplay()
    }
  }

  getWidgets () {
    return this.widgets
  }

  getWidgetsDisplayOptions () {
    return this.widgetsDisplayOptions
  }

  getOptions () {
    return this.options
  }

  getGridsterOptions () {
    return this.gridsterOptions
  }

  setType (type) {
    this.type = type;
  }

  loadDesktopWidgets (tabId, isEditionEnabled) {
    this.options['canEdit'] = false

    if (tabId === 0) {
      this.widgets.splice(0, this.widgets.length)
    } else {
      const route = Routing.generate('claro_desktop_home_widgets_display', {homeTab: tabId})
      this.$http.get(route).then(datas => {
        if (datas['status'] === 200) {
          this.options['canEdit'] = isEditionEnabled && !datas['data']['isLockedHomeTab']
          this.widgets.splice(0, this.widgets.length)
          angular.merge(this.widgets, datas['data']['widgets'])
          this.generateWidgetsDisplayOptions()
          this.checkDesktopWidgetsDisplayOptions()
          this.updateGristerEdition()
          this.secureWidgetsContents()
        }
      })
    }
  }

  loadAdminWidgets (tabId) {
    if (tabId === 0) {
      this.widgets.splice(0, this.widgets.length)
    } else {
      const route = Routing.generate('api_get_admin_widgets_display', {homeTab: tabId})
      this.$http.get(route).then(datas => {
        if (datas['status'] === 200) {
          this.widgets.splice(0, this.widgets.length)
          angular.merge(this.widgets, datas['data'])
          this.generateWidgetsDisplayOptions()
          this.checkAdminWidgetsDisplayOptions()
          this.switchGridsterEdition(true)
          this.secureWidgetsContents()
        }
      })
    }
  }

  updateWidget (data) {
    const index = this.widgets.findIndex(w => w['instanceId'] === data['instanceId'])

    if (index > -1) {
      this.widgets[index]['instanceName'] = data['instanceName']
      this.widgets[index]['color'] = data['color']
      this.widgets[index]['textTitleColor'] = data['textTitleColor']

      if (data['visible'] !== undefined) {
        this.widgets[index]['visible'] = data['visible']
      }

      if (data['locked'] !== undefined) {
        this.widgets[index]['locked'] = data['locked']
      }
    }
  }

  secureWidgetsContents () {
    this.widgets.forEach(w => {
      w['content'] = this.$sce.trustAsHtml(w['content'])
    })
  }

  secureDatas (datas) {
    return this.$sce.trustAsHtml(datas)
  }

  loadWidgetContent (widgetInstanceId) {
    const index = this.widgets.findIndex(w => w['instanceId'] === widgetInstanceId)

    if (index > -1) {
      const route = Routing.generate('claro_widget_instance_content', {widgetInstance: widgetInstanceId})
      this.$http.get(route).then(d => {
        if (d['status'] === 200) {
          this.widgets[index]['content'] = this.secureDatas(d['data'])
        }
      })
    }
  }

  generateWidgetsDisplayOptions () {
    this.widgets.forEach(w => {
      const displayId = w['displayId']
      this.widgetsDisplayOptions[displayId] = {
        id: w['displayId'],
        row: w['row'],
        col: w['col'],
        sizeX: w['sizeX'],
        sizeY: w['sizeY']
      }
    })
  }

  checkDesktopWidgetsDisplayOptions () {
    let modifiedWidgets = []

    this.widgets.forEach(w => {
      const displayId = w['displayId']

      if (w['row'] !== this.widgetsDisplayOptions[displayId]['row'] ||
        w['col'] !== this.widgetsDisplayOptions[displayId]['col'] ||
        w['sizeX'] !== this.widgetsDisplayOptions[displayId]['sizeX'] ||
        w['sizeY'] !== this.widgetsDisplayOptions[displayId]['sizeY']) {

        const widgetDatas = {
          id: displayId,
          row: w['row'],
          col: w['col'],
          sizeX: w['sizeX'],
          sizeY: w['sizeY']
        }
        modifiedWidgets.push(widgetDatas)
      }
    })

    if (modifiedWidgets.length > 0) {
      const json = JSON.stringify(modifiedWidgets)
      const route = Routing.generate('api_put_desktop_widget_display_update', {datas: json})
      this.$http.put(route).then(
        (datas) => {
          if (datas['status'] === 200) {
            const displayDatas = datas['data']

            displayDatas.forEach(d => {
              const id = d['id']
              this.widgetsDisplayOptions[id]['row'] = d['row']
              this.widgetsDisplayOptions[id]['col'] = d['col']
              this.widgetsDisplayOptions[id]['sizeX'] = d['sizeX']
              this.widgetsDisplayOptions[id]['sizeY'] = d['sizeY']
            })
          }
        },
        () => {
          console.log('error')
        }
      )
    } else {
      console.log('no modif')
    }
  }

  checkAdminWidgetsDisplayOptions () {
    let modifiedWidgets = []

    this.widgets.forEach(w => {
      const displayId = w['displayId']

      if (w['row'] !== this.widgetsDisplayOptions[displayId]['row'] ||
        w['col'] !== this.widgetsDisplayOptions[displayId]['col'] ||
        w['sizeX'] !== this.widgetsDisplayOptions[displayId]['sizeX'] ||
        w['sizeY'] !== this.widgetsDisplayOptions[displayId]['sizeY']) {

        const widgetDatas = {
          id: displayId,
          row: w['row'],
          col: w['col'],
          sizeX: w['sizeX'],
          sizeY: w['sizeY']
        }
        modifiedWidgets.push(widgetDatas)
      }
    })

    if (modifiedWidgets.length > 0) {
      const json = JSON.stringify(modifiedWidgets)
      const route = Routing.generate('api_put_admin_widget_display_update', {datas: json})
      this.$http.put(route).then(
        (datas) => {
          if (datas['status'] === 200) {
            const displayDatas = datas['data']

            displayDatas.forEach(d => {
              const id = d['id']
              this.widgetsDisplayOptions[id]['row'] = d['row']
              this.widgetsDisplayOptions[id]['col'] = d['col']
              this.widgetsDisplayOptions[id]['sizeX'] = d['sizeX']
              this.widgetsDisplayOptions[id]['sizeY'] = d['sizeY']
            })
          }
        },
        () => {
          console.log('error')
        }
      )
    } else {
      console.log('no modif')
    }
  }

  updateGristerEdition () {
    const editable = this.options['canEdit']
    this.gridsterOptions['resizable']['enabled'] = editable
    this.gridsterOptions['draggable']['enabled'] = editable
  }

  switchGridsterEdition (editable) {
    this.gridsterOptions['resizable']['enabled'] = editable
    this.gridsterOptions['draggable']['enabled'] = editable
  }

  createUserWidget (tabConfigId) {
    if (!this.isHomeTabLocked) {
      const modal = this.$uibModal.open({
        templateUrl: Routing.generate(
          'api_get_widget_instance_creation_form',
          {htc: tabConfigId}
        ),
        controller: 'DesktopWidgetInstanceCreationModalCtrl',
        controllerAs: 'wfmc',
        resolve: {
          homeTabConfigId: () => { return tabConfigId },
          callback: () => { return this._addWidgetCallback }
        }
      })

      modal.result.then(result => {
        if (!result) {
          return
        } else {
          this._addWidgetCallback(result)
        }
      })
    }
  }

  editUserWidget (widgetInstanceId, widgetDisplayId, configurable) {
    if (!this.isHomeTabLocked) {
      const modal = this.$uibModal.open({
        templateUrl: Routing.generate(
          'api_get_widget_instance_edition_form',
          {wdc: widgetDisplayId}
        ) + '?bust=' + Math.random().toString(36).slice(2),
        controller: 'DesktopWidgetInstanceEditionModalCtrl',
        controllerAs: 'wfmc',
        resolve: {
          widgetInstanceId: () => { return widgetInstanceId },
          widgetDisplayId: () => { return widgetDisplayId },
          configurable: () => { return configurable },
          contentConfig: () => { return null }
        }
      })
    }
  }

  deleteUserWidget (widgetHTCId) {
    if (!this.isHomeTabLocked) {
      const url = Routing.generate(
        'api_delete_desktop_widget_home_tab_config',
        {widgetHomeTabConfig: widgetHTCId}
      )

      this.ClarolineAPIService.confirm(
        {url, method: 'DELETE'},
        this._removeWidgetCallback,
        Translator.trans('widget_home_tab_delete_confirm_title', {}, 'platform'),
        Translator.trans('widget_home_tab_delete_confirm_message', {}, 'platform')
      )
    }
  }

  hideAdminWidget (widgetHTCId) {
    if (!this.isHomeTabLocked) {
      const url = Routing.generate(
        'api_put_desktop_widget_home_tab_config_visibility_change',
        {widgetHomeTabConfig: widgetHTCId}
      )

      this.ClarolineAPIService.confirm(
        {url, method: 'PUT'},
        this._removeWidgetCallback,
        Translator.trans('widget_home_tab_delete_confirm_title', {}, 'platform'),
        Translator.trans('widget_home_tab_delete_confirm_message', {}, 'platform')
      )
    }
  }

  createAdminWidget (tabId) {
    const modal = this.$uibModal.open({
      templateUrl: Routing.generate('api_get_admin_widget_instance_creation_form'),
      controller: 'AdminWidgetInstanceCreationModalCtrl',
      controllerAs: 'wfmc',
      resolve: {
        homeTabId: () => { return tabId },
        callback: () => { return this._addWidgetCallback }
      }
    })

    modal.result.then(result => {
      if (!result) {
        return
      } else {
        this._addWidgetCallback(result)
      }
    })
  }

  editAdminWidget (widgetInstanceId, widgetHomeTabConfigId, widgetDisplayId, configurable) {
    const modal = this.$uibModal.open({
      templateUrl: Routing.generate(
        'api_get_admin_widget_instance_edition_form',
        {whtc: widgetHomeTabConfigId, wdc: widgetDisplayId}
      ) + '?bust=' + Math.random().toString(36).slice(2),
      controller: 'AdminWidgetInstanceEditionModalCtrl',
      controllerAs: 'wfmc',
      resolve: {
        widgetInstanceId: () => { return widgetInstanceId },
        widgetHomeTabConfigId: () => { return widgetHomeTabConfigId },
        widgetDisplayId: () => { return widgetDisplayId },
        configurable: () => { return configurable },
        contentConfig: () => { return null }
      }
    })
  }

  deleteAdminWidget (widgetHTCId) {
    const url = Routing.generate(
      'api_delete_admin_widget_home_tab_config',
      {widgetHomeTabConfig: widgetHTCId}
    )

    this.ClarolineAPIService.confirm(
      {url, method: 'DELETE'},
      this._removeWidgetCallback,
      Translator.trans('widget_home_tab_delete_confirm_title', {}, 'platform'),
      Translator.trans('widget_home_tab_delete_confirm_message', {}, 'platform')
    )
  }
}