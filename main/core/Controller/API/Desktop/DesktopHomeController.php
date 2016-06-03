<?php

/*
 * This file is part of the Claroline Connect package.
 *
 * (c) Claroline Consortium <consortium@claroline.net>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Claroline\CoreBundle\Controller\API\Desktop;

use Claroline\CoreBundle\Entity\Home\HomeTab;
use Claroline\CoreBundle\Entity\Home\HomeTabConfig;
use Claroline\CoreBundle\Entity\User;
use Claroline\CoreBundle\Entity\Widget\WidgetDisplayConfig;
use Claroline\CoreBundle\Entity\Widget\WidgetHomeTabConfig;
use Claroline\CoreBundle\Entity\Widget\WidgetInstance;
use Claroline\CoreBundle\Event\Log\LogHomeTabAdminUserEditEvent;
use Claroline\CoreBundle\Event\Log\LogHomeTabUserCreateEvent;
use Claroline\CoreBundle\Event\Log\LogHomeTabUserDeleteEvent;
use Claroline\CoreBundle\Event\Log\LogHomeTabUserEditEvent;
use Claroline\CoreBundle\Event\Log\LogHomeTabWorkspaceUnpinEvent;
use Claroline\CoreBundle\Event\Log\LogWidgetAdminHideEvent;
use Claroline\CoreBundle\Event\Log\LogWidgetUserCreateEvent;
use Claroline\CoreBundle\Event\Log\LogWidgetUserDeleteEvent;
use Claroline\CoreBundle\Event\Log\LogWidgetUserEditEvent;
use Claroline\CoreBundle\Form\HomeTabType;
use Claroline\CoreBundle\Form\WidgetInstanceConfigType;
use Claroline\CoreBundle\Library\Security\Utilities;
use Claroline\CoreBundle\Manager\ApiManager;
use Claroline\CoreBundle\Manager\HomeTabManager;
use Claroline\CoreBundle\Manager\PluginManager;
use Claroline\CoreBundle\Manager\RoleManager;
use Claroline\CoreBundle\Manager\UserManager;
use Claroline\CoreBundle\Manager\WidgetManager;
use JMS\DiExtraBundle\Annotation as DI;
use Sensio\Bundle\FrameworkExtraBundle\Configuration as EXT;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;
use Symfony\Component\Security\Core\Authorization\AuthorizationCheckerInterface;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

class DesktopHomeController extends Controller
{
    private $apiManager;
    private $authorization;
    private $bundles;
    private $eventDispatcher;
    private $homeTabManager;
    private $pluginManager;
    private $request;
    private $roleManager;
    private $tokenStorage;
    private $userManager;
    private $utils;
    private $widgetManager;

    /**
     * @DI\InjectParams({
     *     "apiManager"      = @DI\Inject("claroline.manager.api_manager"),
     *     "authorization"   = @DI\Inject("security.authorization_checker"),
     *     "eventDispatcher" = @DI\Inject("event_dispatcher"),
     *     "homeTabManager"  = @DI\Inject("claroline.manager.home_tab_manager"),
     *     "pluginManager"   = @DI\Inject("claroline.manager.plugin_manager"),
     *     "request"         = @DI\Inject("request"),
     *     "roleManager"     = @DI\Inject("claroline.manager.role_manager"),
     *     "tokenStorage"    = @DI\Inject("security.token_storage"),
     *     "userManager"     = @DI\Inject("claroline.manager.user_manager"),
     *     "utils"           = @DI\Inject("claroline.security.utilities"),
     *     "widgetManager"   = @DI\Inject("claroline.manager.widget_manager")
     * })
     */
    public function __construct(
        ApiManager $apiManager,
        AuthorizationCheckerInterface $authorization,
        EventDispatcherInterface $eventDispatcher,
        HomeTabManager $homeTabManager,
        PluginManager $pluginManager,
        Request $request,
        RoleManager $roleManager,
        TokenStorageInterface $tokenStorage,
        UserManager $userManager,
        Utilities $utils,
        WidgetManager $widgetManager
    )
    {
        $this->apiManager = $apiManager;
        $this->authorization = $authorization;
        $this->bundles = $pluginManager->getEnabled(true);
        $this->eventDispatcher = $eventDispatcher;
        $this->homeTabManager = $homeTabManager;
        $this->pluginManager = $pluginManager;
        $this->request = $request;
        $this->roleManager = $roleManager;
        $this->tokenStorage = $tokenStorage;
        $this->userManager = $userManager;
        $this->utils = $utils;
        $this->widgetManager = $widgetManager;
    }

    /**
     * @EXT\Route(
     *     "/api/desktop/home/options",
     *     name="api_get_desktop_options",
     *     options = {"expose"=true}
     * )
     * @EXT\ParamConverter("user", options={"authenticatedUser" = true})
     *
     * Returns desktop options
     *
     * @return \Symfony\Component\HttpFoundation\JsonResponse
     */
    public function getDesktopOptionsAction(User $user)
    {
        $options = $this->userManager->getUserOptions($user);
        $desktopOptions = array();
        $desktopOptions['editionMode'] = $options->getDesktopMode() === 1;
        $desktopOptions['isHomeLocked'] = $this->roleManager->isHomeLocked($user);

        return new JsonResponse($desktopOptions, 200);
    }

    /**
     * @EXT\Route(
     *     "/api/desktop/home/tabs",
     *     name="api_get_desktop_home_tabs",
     *     options = {"expose"=true}
     * )
     * @EXT\ParamConverter("user", options={"authenticatedUser" = true})
     *
     * Returns list of desktop home tabs
     *
     * @return \Symfony\Component\HttpFoundation\JsonResponse
     */
    public function getDesktopHomeTabsAction(User $user)
    {
        $options = $this->userManager->getUserOptions($user);
        $desktopHomeDatas = array(
            'tabsAdmin' => array(),
            'tabsUser' => array(),
            'tabsWorkspace' => array()
        );
        $desktopHomeDatas['editionMode'] = $options->getDesktopMode() === 1;
        $desktopHomeDatas['isHomeLocked'] = $this->roleManager->isHomeLocked($user);
        $userHomeTabConfigs = array();
        $roleNames = $this->utils->getRoles($this->tokenStorage->getToken());

        if ($desktopHomeDatas['isHomeLocked']) {
            $visibleAdminHomeTabConfigs = $this->homeTabManager
                ->getVisibleAdminDesktopHomeTabConfigsByRoles($roleNames);
            $workspaceUserHTCs = $this->homeTabManager
                ->getVisibleWorkspaceUserHTCsByUser($user);
        } else {
            $adminHomeTabConfigs = $this->homeTabManager
                ->generateAdminHomeTabConfigsByUser($user, $roleNames);
            $visibleAdminHomeTabConfigs = $this->homeTabManager
                ->filterVisibleHomeTabConfigs($adminHomeTabConfigs);
            $userHomeTabConfigs = $this->homeTabManager
                ->getVisibleDesktopHomeTabConfigsByUser($user);
            $workspaceUserHTCs = $this->homeTabManager
                ->getVisibleWorkspaceUserHTCsByUser($user);
        }

        foreach ($visibleAdminHomeTabConfigs as $htc) {
            $tab = $htc->getHomeTab();
            $details = $htc->getDetails();
            $color = isset($details['color']) ? $details['color'] : null;
            $desktopHomeDatas['tabsAdmin'][] = array(
                'configId' => $htc->getId(),
                'locked' => $htc->isLocked(),
                'tabOrder' => $htc->getTabOrder(),
                'type' => $htc->getType(),
                'visible' => $htc->isVisible(),
                'tabId' => $tab->getId(),
                'tabName' => $tab->getName(),
                'tabType' => $tab->getType(),
                'tabIcon' => $tab->getIcon(),
                'color' => $color
            );
        }

        foreach ($userHomeTabConfigs as $htc) {
            $tab = $htc->getHomeTab();
            $details = $htc->getDetails();
            $color = isset($details['color']) ? $details['color'] : null;
            $desktopHomeDatas['tabsUser'][] = array(
                'configId' => $htc->getId(),
                'locked' => $htc->isLocked(),
                'tabOrder' => $htc->getTabOrder(),
                'type' => $htc->getType(),
                'visible' => $htc->isVisible(),
                'tabId' => $tab->getId(),
                'tabName' => $tab->getName(),
                'tabType' => $tab->getType(),
                'tabIcon' => $tab->getIcon(),
                'color' => $color
            );
        }

        foreach ($workspaceUserHTCs as $htc) {
            $tab = $htc->getHomeTab();
            $details = $htc->getDetails();
            $color = isset($details['color']) ? $details['color'] : null;
            $desktopHomeDatas['tabsWorkspace'][] = array(
                'configId' => $htc->getId(),
                'locked' => $htc->isLocked(),
                'tabOrder' => $htc->getTabOrder(),
                'type' => $htc->getType(),
                'visible' => $htc->isVisible(),
                'tabId' => $tab->getId(),
                'tabName' => $tab->getName(),
                'tabType' => $tab->getType(),
                'tabIcon' => $tab->getIcon(),
                'color' => $color
            );
        }

        return new JsonResponse($desktopHomeDatas, 200);
    }

    /**
     * @EXT\Route(
     *     "/api/desktop/home/edition/mode/toggle",
     *     name="api_put_desktop_home_edition_mode_toggle",
     *     options = {"expose"=true}
     * )
     * @EXT\ParamConverter("user", options={"authenticatedUser" = true})
     *
     * Switch desktop home edition mode
     *
     * @return \Symfony\Component\HttpFoundation\JsonResponse
     */
    public function putDesktopHomeEditionModeToggleAction(User $user)
    {
        $options = $this->userManager->switchDesktopMode($user);

        return new JsonResponse($options->getDesktopMode(), 200);
    }

    /**
     * @EXT\Route(
     *     "/api/desktop/admin/home/tab/{htc}/visibility/toggle",
     *     name="api_put_admin_home_tab_visibility_toggle",
     *     options = {"expose"=true}
     * )
     * @EXT\ParamConverter("user", options={"authenticatedUser" = true})
     *
     * Toggle visibility for admin home tab
     *
     * @return \Symfony\Component\HttpFoundation\JsonResponse
     */
    public function putAdminHomeTabVisibilityToggleAction(User $user, HomeTabConfig $htc)
    {
        $this->checkHomeTabConfig($user, $htc, 'admin_desktop');
        $htc->setVisible(!$htc->isVisible());
        $this->homeTabManager->insertHomeTabConfig($htc);
        $tab = $htc->getHomeTab();
        $details = $htc->getDetails();
        $color = isset($details['color']) ? $details['color'] : null;
        $htcDatas = array(
            'configId' => $htc->getId(),
            'locked' => $htc->isLocked(),
            'tabOrder' => $htc->getTabOrder(),
            'type' => $htc->getType(),
            'visible' => $htc->isVisible(),
            'tabId' => $tab->getId(),
            'tabName' => $tab->getName(),
            'tabType' => $tab->getType(),
            'tabIcon' => $tab->getIcon(),
            'color' => $color,
            'details' => $details
        );
        $event = new LogHomeTabAdminUserEditEvent($htc);
        $this->eventDispatcher->dispatch('log', $event);

        return new JsonResponse($htcDatas, 200);
    }

    /**
     * @EXT\Route(
     *     "/api/desktop/home/tab/create/form",
     *     name="api_get_user_home_tab_creation_form",
     *     options = {"expose"=true}
     * )
     * @EXT\ParamConverter("user", options={"authenticatedUser" = true})
     *
     * Returns the home tab creation form
     */
    public function getUserHomeTabCreationFormAction()
    {
        $this->checkHomeLocked();
        $formType = new HomeTabType();
        $formType->enableApi();
        $form = $this->createForm($formType);

        return $this->apiManager->handleFormView(
            'ClarolineCoreBundle:API:HomeTab\userHomeTabCreateForm.html.twig',
            $form
        );
    }

    /**
     * @EXT\Route(
     *     "/api/desktop/home/tab/create",
     *     name="api_post_user_home_tab_creation",
     *     options = {"expose"=true}
     * )
     * @EXT\ParamConverter("user", options={"authenticatedUser" = true})
     *
     * Creates a desktop home tab
     *
     * @return \Symfony\Component\HttpFoundation\JsonResponse
     */
    public function postUserHomeTabCreationAction(User $user)
    {
        $this->checkHomeLocked();
        $formType = new HomeTabType();
        $formType->enableApi();
        $form = $this->createForm($formType);
        $form->submit($this->request);

        if ($form->isValid()) {
            $formDatas = $form->getData();
            $color = $form->get('color')->getData();

            $homeTab = new HomeTab();
            $homeTab->setName($formDatas['name']);
            $homeTab->setType('desktop');
            $homeTab->setUser($user);

            $homeTabConfig = new HomeTabConfig();
            $homeTabConfig->setHomeTab($homeTab);
            $homeTabConfig->setType('desktop');
            $homeTabConfig->setUser($user);
            $homeTabConfig->setLocked(false);
            $homeTabConfig->setVisible(true);
            $homeTabConfig->setDetails(array('color' => $color));

            $lastOrder = $this->homeTabManager->getOrderOfLastDesktopHomeTabConfigByUser($user);

            if (is_null($lastOrder['order_max'])) {
                $homeTabConfig->setTabOrder(1);
            } else {
                $homeTabConfig->setTabOrder($lastOrder['order_max'] + 1);
            }
            $this->homeTabManager->persistHomeTabConfigs($homeTab, $homeTabConfig);
            $event = new LogHomeTabUserCreateEvent($homeTabConfig);
            $this->eventDispatcher->dispatch('log', $event);

            $homeTabDatas = array(
                'configId' => $homeTabConfig->getId(),
                'locked' => $homeTabConfig->isLocked(),
                'tabOrder' => $homeTabConfig->getTabOrder(),
                'type' => $homeTabConfig->getType(),
                'visible' => $homeTabConfig->isVisible(),
                'tabId' => $homeTab->getId(),
                'tabName' => $homeTab->getName(),
                'tabType' => $homeTab->getType(),
                'tabIcon' => $homeTab->getIcon(),
                'color' => $color
            );

            return new JsonResponse($homeTabDatas, 200);
        } else {
            $options = array(
                'http_code' => 400,
                'extra_parameters' => null,
                'serializer_group' => 'api_home_tab'
            );

            return $this->apiManager->handleFormView(
                'ClarolineCoreBundle:API:HomeTab\userHomeTabCreateForm.html.twig',
                $form,
                $options
            );
        }
    }

    /**
     * @EXT\Route(
     *     "/api/desktop/home/tab/{homeTab}/edit/form",
     *     name="api_get_user_home_tab_edition_form",
     *     options = {"expose"=true}
     * )
     * @EXT\ParamConverter("user", options={"authenticatedUser" = true})
     *
     * Returns the home tab edition form
     *
     * @return \Symfony\Component\HttpFoundation\JsonResponse
     */
    public function getUserHomeTabEditionFormAction(User $user, HomeTab $homeTab)
    {
        $this->checkHomeLocked();
        $this->checkHomeTabEdition($homeTab, $user);

        $homeTabConfig = $this->homeTabManager->getHomeTabConfigByHomeTabAndUser($homeTab, $user);
        $details = !is_null($homeTabConfig) ? $homeTabConfig->getDetails() : null;
        $color = isset($details['color']) ? $details['color'] : null;

        $formType = new HomeTabType('desktop', $color);
        $formType->enableApi();
        $form = $this->createForm($formType, $homeTab);

        return $this->apiManager->handleFormView(
            'ClarolineCoreBundle:API:HomeTab\userHomeTabEditForm.html.twig',
            $form
        );
    }

    /**
     * @EXT\Route(
     *     "/api/desktop/home/tab/{homeTab}/edit",
     *     name="api_put_user_home_tab_edition",
     *     options = {"expose"=true}
     * )
     * @EXT\ParamConverter("user", options={"authenticatedUser" = true})
     *
     * Edits a home tab
     *
     * @return \Symfony\Component\HttpFoundation\JsonResponse
     */
    public function putUserHomeTabEditionAction(User $user, HomeTab $homeTab)
    {
        $this->checkHomeLocked();
        $this->checkHomeTabEdition($homeTab, $user);

        $formType = new HomeTabType();
        $formType->enableApi();
        $form = $this->createForm($formType);
        $form->submit($this->request);

        if ($form->isValid()) {
            $homeTabConfig = $this->homeTabManager->getHomeTabConfigByHomeTabAndUser($homeTab, $user);

            if (is_null($homeTabConfig)) {
                $homeTabConfig = new HomeTabConfig();
                $homeTabConfig->setHomeTab($homeTab);
                $homeTabConfig->setType('desktop');
                $homeTabConfig->setUser($user);
                $homeTabConfig->setLocked(false);
                $homeTabConfig->setVisible(true);
                $lastOrder = $this->homeTabManager->getOrderOfLastDesktopHomeTabConfigByUser($user);

                if (is_null($lastOrder['order_max'])) {
                    $homeTabConfig->setTabOrder(1);
                } else {
                    $homeTabConfig->setTabOrder($lastOrder['order_max'] + 1);
                }
            }
            $formDatas = $form->getData();
            $homeTab->setName($formDatas['name']);
            $color = $form->get('color')->getData();
            $details = $homeTabConfig->getDetails();

            if (is_null($details)) {
                $details = array();
            }
            $details['color'] = $color;
            $homeTabConfig->setDetails($details);
            $this->homeTabManager->persistHomeTabConfigs($homeTab, $homeTabConfig);
            $event = new LogHomeTabUserEditEvent($homeTabConfig);
            $this->eventDispatcher->dispatch('log', $event);

            $homeTabDatas = array(
                'configId' => $homeTabConfig->getId(),
                'locked' => $homeTabConfig->isLocked(),
                'tabOrder' => $homeTabConfig->getTabOrder(),
                'type' => $homeTabConfig->getType(),
                'visible' => $homeTabConfig->isVisible(),
                'tabId' => $homeTab->getId(),
                'tabName' => $homeTab->getName(),
                'tabType' => $homeTab->getType(),
                'tabIcon' => $homeTab->getIcon(),
                'color' => $color
            );

            return new JsonResponse($homeTabDatas, 200);
        } else {
            $options = array(
                'http_code' => 400,
                'extra_parameters' => null,
                'serializer_group' => 'api_home_tab'
            );

            return $this->apiManager->handleFormView(
                'ClarolineCoreBundle:API:HomeTab\userHomeTabEditForm.html.twig',
                $form,
                $options
            );
        }
    }

    /**
     * @EXT\Route(
     *     "/api/desktop/home/tab/{htc}/delete",
     *     name="api_delete_user_home_tab",
     *     options = {"expose"=true}
     * )
     * @EXT\ParamConverter("user", options={"authenticatedUser" = true})
     *
     * Deletes user home tab
     *
     * @return \Symfony\Component\HttpFoundation\JsonResponse
     */
    public function deleteUserHomeTabAction(User $user, HomeTabConfig $htc)
    {
        $this->checkHomeTabConfig($user, $htc, 'desktop');
        $tab = $htc->getHomeTab();
        $details = $htc->getDetails();
        $color = isset($details['color']) ? $details['color'] : null;
        $htcDatas = array(
            'configId' => $htc->getId(),
            'locked' => $htc->isLocked(),
            'tabOrder' => $htc->getTabOrder(),
            'type' => $htc->getType(),
            'visible' => $htc->isVisible(),
            'tabId' => $tab->getId(),
            'tabName' => $tab->getName(),
            'tabType' => $tab->getType(),
            'tabIcon' => $tab->getIcon(),
            'color' => $color,
            'details' => $details
        );
        $this->homeTabManager->deleteHomeTabConfig($htc);
        $this->homeTabManager->deleteHomeTab($tab);
        $event = new LogHomeTabUserDeleteEvent($htcDatas);
        $this->eventDispatcher->dispatch('log', $event);

        return new JsonResponse($htcDatas, 200);
    }

    /**
     * @EXT\Route(
     *     "/api/desktop/pinned/home/tab/{htc}/delete",
     *     name="api_delete_pinned_workspace_home_tab",
     *     options = {"expose"=true}
     * )
     * @EXT\ParamConverter("user", options={"authenticatedUser" = true})
     *
     * Delete pinned workspace home tab
     *
     * @return \Symfony\Component\HttpFoundation\JsonResponse
     */
    public function deletePinnedWorkspaceHomeTabAction(User $user, HomeTabConfig $htc)
    {
        $this->checkHomeTabConfig($user, $htc, 'workspace_user');
        $workspace = $htc->getWorkspace();
        $tab = $htc->getHomeTab();
        $details = $htc->getDetails();
        $color = isset($details['color']) ? $details['color'] : null;
        $htcDatas = array(
            'configId' => $htc->getId(),
            'locked' => $htc->isLocked(),
            'tabOrder' => $htc->getTabOrder(),
            'type' => $htc->getType(),
            'visible' => $htc->isVisible(),
            'tabId' => $tab->getId(),
            'tabName' => $tab->getName(),
            'tabType' => $tab->getType(),
            'tabIcon' => $tab->getIcon(),
            'color' => $color,
            'details' => $details
        );
        $this->homeTabManager->deleteHomeTabConfig($htc);
        $event = new LogHomeTabWorkspaceUnpinEvent($user, $workspace, $htcDatas);
        $this->eventDispatcher->dispatch('log', $event);

        return new JsonResponse($htcDatas, 200);
    }

    /**
     * @EXT\Route(
     *     "/api/home/tab/{homeTabConfig}/next/{nextHomeTabConfigId}/reorder",
     *     name="api_post_desktop_home_tab_config_reorder",
     *     options = {"expose"=true}
     * )
     * @EXT\ParamConverter("user", options={"authenticatedUser" = true})
     *
     * Update desktop HomeTabConfig order
     *
     * @return Response
     */
    public function postDesktopHomeTabConfigReorderAction(
        User $user,
        HomeTabConfig $homeTabConfig,
        $nextHomeTabConfigId
    ) {
        $homeTab = $homeTabConfig->getHomeTab();
        $this->checkHomeTabEdition($homeTab, $user);

        $this->homeTabManager->reorderDesktopHomeTabConfigs(
            $user,
            $homeTabConfig,
            $nextHomeTabConfigId
        );

        return new JsonResponse('success', 200);
    }

    /**
     * @EXT\Route(
     *     "/api/home/tab/{htc}/widget/create/form",
     *     name="api_get_widget_instance_creation_form",
     *     options = {"expose"=true}
     * )
     * @EXT\ParamConverter("user", options={"authenticatedUser" = true})
     *
     * Returns the widget instance creation form
     */
    public function getWidgetInstanceCreationFormAction(User $user, HomeTabConfig $htc)
    {
        $this->checkWidgetCreation($user, $htc);
        $formType = new WidgetInstanceConfigType('desktop', $this->bundles, true, $user->getEntityRoles());
        $formType->enableApi();
        $form = $this->createForm($formType);

        return $this->apiManager->handleFormView(
            'ClarolineCoreBundle:API:Widget\widgetInstanceCreateForm.html.twig',
            $form
        );
    }

    /**
     * @EXT\Route(
     *     "/api/home/tab/widget/{wdc}/edit/form",
     *     name="api_get_widget_instance_edition_form",
     *     options = {"expose"=true}
     * )
     * @EXT\ParamConverter("user", options={"authenticatedUser" = true})
     *
     * Returns the widget instance edition form
     */
    public function getWidgetInstanceEditionFormAction(User $user, WidgetDisplayConfig $wdc)
    {
        $this->checkWidgetDisplayConfigEdition($user, $wdc);
        $widgetInstance = $wdc->getWidgetInstance();
        $widget = $widgetInstance->getWidget();
        $this->checkWidgetInstanceEdition($user, $widgetInstance);
        $color = $wdc->getColor();
        $details = $wdc->getDetails();
        $textTitleColor = isset($details['textTitleColor']) ? $details['textTitleColor'] : null;
        $formType = new WidgetInstanceConfigType('desktop', $this->bundles, false, [], $color, $textTitleColor, false, true, false);
        $formType->enableApi();
        $form = $this->createForm($formType, $widgetInstance);

        return $this->apiManager->handleFormView(
            'ClarolineCoreBundle:API:Widget\widgetInstanceEditForm.html.twig',
            $form,
            array('extra_infos' => $widget->isConfigurable())
        );
    }

    /**
     * @EXT\Route(
     *     "/api/home/tab/widget/{widgetInstance}/content/configure/form",
     *     name="api_get_widget_instance_content_configuration_form",
     *     options = {"expose"=true}
     * )
     * @EXT\ParamConverter("user", options={"authenticatedUser" = true})
     *
     * Returns the widget instance content configuration form
     */
    public function getWidgetInstanceContentConfigurationFormAction(WidgetInstance $widgetInstance)
    {
        $widget = $widgetInstance->getWidget();

        if ($widget->isConfigurable()) {
            $event = $this->get('claroline.event.event_dispatcher')->dispatch(
                "widget_{$widgetInstance->getWidget()->getName()}_configuration",
                'ConfigureWidget',
                array($widgetInstance)
            );
            $content = $event->getContent();
        } else {
            $content = null;
        }

        return new JsonResponse($content);
    }

    /**
     * @EXT\Route(
     *     "/api/home/tab/{htc}/widget/create",
     *     name="api_post_desktop_widget_instance_creation",
     *     options = {"expose"=true}
     * )
     * @EXT\ParamConverter("user", options={"authenticatedUser" = true})
     *
     * Creates a new widget instance
     */
    public function postDesktopWidgetInstanceCreationAction(User $user, HomeTabConfig $htc)
    {
        $this->checkWidgetCreation($user, $htc);
        $formType = new WidgetInstanceConfigType('desktop', $this->bundles, true, $user->getEntityRoles());
        $formType->enableApi();
        $form = $this->createForm($formType);
        $form->submit($this->request);

        if ($form->isValid()) {
            $homeTab = $htc->getHomeTab();
            $formDatas = $form->getData();
            $widget = $formDatas['widget'];
            $color = $form->get('color')->getData();
            $textTitleColor = $form->get('textTitleColor')->getData();

            $widgetInstance = new WidgetInstance();
            $widgetHomeTabConfig = new WidgetHomeTabConfig();
            $widgetDisplayConfig = new WidgetDisplayConfig();
            $widgetInstance->setName($formDatas['name']);
            $widgetInstance->setUser($user);
            $widgetInstance->setWidget($widget);
            $widgetInstance->setIsAdmin(false);
            $widgetInstance->setIsDesktop(true);
            $widgetHomeTabConfig->setHomeTab($homeTab);
            $widgetHomeTabConfig->setWidgetInstance($widgetInstance);
            $widgetHomeTabConfig->setUser($user);
            $widgetHomeTabConfig->setVisible(true);
            $widgetHomeTabConfig->setLocked(false);
            $widgetHomeTabConfig->setWidgetOrder(1);
            $widgetHomeTabConfig->setType('desktop');
            $widgetDisplayConfig->setWidgetInstance($widgetInstance);
            $widgetDisplayConfig->setUser($user);
            $widgetDisplayConfig->setWidth($widget->getDefaultWidth());
            $widgetDisplayConfig->setHeight($widget->getDefaultHeight());
            $widgetDisplayConfig->setColor($color);
            $widgetDisplayConfig->setDetails(array('textTitleColor' => $textTitleColor));

            $this->widgetManager->persistWidgetConfigs(
                $widgetInstance,
                $widgetHomeTabConfig,
                $widgetDisplayConfig
            );
            $event = new LogWidgetUserCreateEvent($homeTab, $widgetHomeTabConfig, $widgetDisplayConfig);
            $this->eventDispatcher->dispatch('log', $event);

            $widgetDatas = array(
                'widgetId' => $widget->getId(),
                'widgetName' => $widget->getName(),
                'configId' => $widgetHomeTabConfig->getId(),
                'configurable' => $widgetHomeTabConfig->isLocked() !== true && $widget->isConfigurable(),
                'locked' => $widgetHomeTabConfig->isLocked(),
                'type' => $widgetHomeTabConfig->getType(),
                'instanceId' => $widgetInstance->getId(),
                'instanceName' => $widgetInstance->getName(),
                'instanceIcon' => $widgetInstance->getIcon(),
                'displayId' => $widgetDisplayConfig->getId(),
                'row' => null,
                'col' => null,
                'sizeY' => $widgetDisplayConfig->getHeight(),
                'sizeX' => $widgetDisplayConfig->getWidth(),
                'color' => $color,
                'textTitleColor' => $textTitleColor
            );

            return new JsonResponse($widgetDatas, 200);
        } else {
            $options = array(
                'http_code' => 400,
                'extra_parameters' => null,
                'serializer_group' => 'api_widget'
            );

            return $this->apiManager->handleFormView(
                'ClarolineCoreBundle:API:Widget\widgetInstanceCreateForm.html.twig',
                $form,
                $options
            );
        }
    }

    /**
     * @EXT\Route(
     *     "/api/home/tab/widget/{wdc}/edit",
     *     name="api_put_widget_instance_edition",
     *     options = {"expose"=true}
     * )
     * @EXT\ParamConverter("user", options={"authenticatedUser" = true})
     *
     * Edits widget instance config
     */
    public function putWidgetInstanceEditionAction(User $user, WidgetDisplayConfig $wdc)
    {
        $this->checkWidgetDisplayConfigEdition($user, $wdc);
        $widgetInstance = $wdc->getWidgetInstance();
        $widget = $widgetInstance->getWidget();
        $this->checkWidgetInstanceEdition($user, $widgetInstance);
        $color = $wdc->getColor();
        $details = $wdc->getDetails();
        $textTitleColor = isset($details['textTitleColor']) ? $details['textTitleColor'] : null;
        $formType = new WidgetInstanceConfigType('desktop', $this->bundles, false, [], $color, $textTitleColor, false, true, false);
        $formType->enableApi();
        $form = $this->createForm($formType, $widgetInstance);
        $form->submit($this->request);

        if ($form->isValid()) {
            $instance = $form->getData();
            $name = $instance->getName();
            $color = $form->get('color')->getData();
            $textTitleColor = $form->get('textTitleColor')->getData();
            $widgetInstance->setName($name);
            $wdc->setColor($color);
            $details = $wdc->getDetails();

            if (is_null($details)) {
                $details = array();
            }
            $details['textTitleColor'] = $textTitleColor;
            $wdc->setDetails($details);

            $this->widgetManager->persistWidgetConfigs($widgetInstance, null, $wdc);
            $event = new LogWidgetUserEditEvent($widgetInstance, null, $wdc);
            $this->eventDispatcher->dispatch('log', $event);

            $widgetDatas = array(
                'widgetId' => $widget->getId(),
                'widgetName' => $widget->getName(),
                'instanceId' => $widgetInstance->getId(),
                'instanceName' => $widgetInstance->getName(),
                'instanceIcon' => $widgetInstance->getIcon(),
                'displayId' => $wdc->getId(),
                'row' => null,
                'col' => null,
                'sizeY' => $wdc->getHeight(),
                'sizeX' => $wdc->getWidth(),
                'color' => $color,
                'textTitleColor' => $textTitleColor
            );

            return new JsonResponse($widgetDatas, 200);
        } else {
            $options = array(
                'http_code' => 400,
                'extra_parameters' => null,
                'serializer_group' => 'api_widget',
                'extra_infos' => $widget->isConfigurable()
            );

            return $this->apiManager->handleFormView(
                'ClarolineCoreBundle:API:Widget\widgetInstanceEditForm.html.twig',
                $form,
                $options
            );
        }
    }

    /**
     * @EXT\Route(
     *     "/api/desktop/home/tab/widget/{widgetHomeTabConfig}/visibility/change",
     *     name="api_put_desktop_widget_home_tab_config_visibility_change",
     *     options = {"expose"=true}
     * )
     * @EXT\ParamConverter("user", options={"authenticatedUser" = true})
     *
     * Changes visibility of a widget
     *
     * @return \Symfony\Component\HttpFoundation\JsonResponse
     */
    public function putDesktopWidgetHomeTabConfigVisibilityChangeAction(User $user, WidgetHomeTabConfig $widgetHomeTabConfig)
    {
        $this->checkWidgetHomeTabConfigEdition($user, $widgetHomeTabConfig);
        $this->homeTabManager->changeVisibilityWidgetHomeTabConfig($widgetHomeTabConfig, false);
        $homeTab = $widgetHomeTabConfig->getHomeTab();
        $event = new LogWidgetAdminHideEvent($homeTab, $widgetHomeTabConfig);
        $this->eventDispatcher->dispatch('log', $event);

        $widgetInstance = $widgetHomeTabConfig->getWidgetInstance();
        $widget = $widgetInstance->getWidget();
        $datas = array(
            'widgetId' => $widget->getId(),
            'widgetName' => $widget->getName(),
            'widgetIsConfigurable' => $widget->isConfigurable(),
            'widgetIsExportable' => $widget->isExportable(),
            'widgetIsDisplayableInWorkspace' => $widget->isDisplayableInWorkspace(),
            'widgetIsDisplayableInDesktop' => $widget->isDisplayableInDesktop(),
            'id' => $widgetInstance->getId(),
            'name' => $widgetInstance->getName(),
            'icon' => $widgetInstance->getIcon(),
            'isAdmin' => $widgetInstance->isAdmin(),
            'isDesktop' => $widgetInstance->isDesktop(),
            'widgetHomeTabConfigId' => $widgetHomeTabConfig->getId(),
            'order' => $widgetHomeTabConfig->getWidgetOrder(),
            'type' => $widgetHomeTabConfig->getType(),
            'visible' => $widgetHomeTabConfig->isVisible(),
            'locked' => $widgetHomeTabConfig->isLocked()
        );

        return new JsonResponse($datas, 200);
    }

    /**
     * @EXT\Route(
     *     "/api/desktop/home/tab/widget/{widgetHomeTabConfig}/delete",
     *     name="api_delete_desktop_widget_home_tab_config",
     *     options = {"expose"=true}
     * )
     * @EXT\ParamConverter("user", options={"authenticatedUser" = true})
     *
     * Deletes a widget
     *
     * @return \Symfony\Component\HttpFoundation\JsonResponse
     */
    public function deleteDesktopWidgetHomeTabConfigAction(User $user, WidgetHomeTabConfig $widgetHomeTabConfig)
    {
        $this->checkWidgetHomeTabConfigEdition($user, $widgetHomeTabConfig);
        $homeTab = $widgetHomeTabConfig->getHomeTab();
        $widgetInstance = $widgetHomeTabConfig->getWidgetInstance();
        $widget = $widgetInstance->getWidget();
        $datas = array(
            'tabId' => $homeTab->getId(),
            'tabName' => $homeTab->getName(),
            'tabType' => $homeTab->getType(),
            'tabIcon' => $homeTab->getIcon(),
            'widgetId' => $widget->getId(),
            'widgetName' => $widget->getName(),
            'widgetIsConfigurable' => $widget->isConfigurable(),
            'widgetIsExportable' => $widget->isExportable(),
            'widgetIsDisplayableInWorkspace' => $widget->isDisplayableInWorkspace(),
            'widgetIsDisplayableInDesktop' => $widget->isDisplayableInDesktop(),
            'id' => $widgetInstance->getId(),
            'name' => $widgetInstance->getName(),
            'icon' => $widgetInstance->getIcon(),
            'isAdmin' => $widgetInstance->isAdmin(),
            'isDesktop' => $widgetInstance->isDesktop(),
            'widgetHomeTabConfigId' => $widgetHomeTabConfig->getId(),
            'order' => $widgetHomeTabConfig->getWidgetOrder(),
            'type' => $widgetHomeTabConfig->getType(),
            'visible' => $widgetHomeTabConfig->isVisible(),
            'locked' => $widgetHomeTabConfig->isLocked()
        );
        $this->homeTabManager->deleteWidgetHomeTabConfig($widgetHomeTabConfig);

        if ($this->hasUserAccessToWidgetInstance($user, $widgetInstance)) {
            $this->widgetManager->removeInstance($widgetInstance);
        }
        $event = new LogWidgetUserDeleteEvent($datas);
        $this->eventDispatcher->dispatch('log', $event);

        return new JsonResponse($datas, 200);
    }

    /**
     * @EXT\Route(
     *     "/api/desktop/widget/display/{datas}/update",
     *     name="api_put_desktop_widget_display_update",
     *     options = {"expose"=true}
     * )
     * @EXT\ParamConverter("user", options={"authenticatedUser" = true})
     *
     * Updates widgets display
     *
     * @return \Symfony\Component\HttpFoundation\JsonResponse
     */
    public function putDesktopWidgetDisplayUpdateAction(User $user, $datas)
    {
        $jsonDatas = json_decode($datas, true);
        $displayConfigs = array();

        foreach($jsonDatas as $data) {
            $displayConfig = $this->widgetManager->getWidgetDisplayConfigById($data['id']);

            if (!is_null($displayConfig)) {
                $this->checkWidgetDisplayConfigEdition($user, $displayConfig);
                $displayConfig->setRow($data['row']);
                $displayConfig->setColumn($data['col']);
                $displayConfig->setWidth($data['sizeX']);
                $displayConfig->setHeight($data['sizeY']);
                $displayConfigs[] = $displayConfig;
            }
        }
        $this->widgetManager->persistWidgetDisplayConfigs($displayConfigs);

        return new JsonResponse($jsonDatas, 200);
    }

    private function checkHomeLocked()
    {
        $user = $this->tokenStorage->getToken()->getUser();

        if ($user === '.anon' || $this->roleManager->isHomeLocked($user)) {

            throw new AccessDeniedException();
        }
    }

    private function checkHomeTabConfig(User $authenticatedUser, HomeTabConfig $htc, $homeTabType)
    {
        $user = $htc->getUser();
        $type = $htc->getType();

        if ($type !== $homeTabType || $authenticatedUser !== $user) {

            throw new AccessDeniedException();
        }
    }

    private function checkHomeTabEdition(HomeTab $homeTab, User $user)
    {
        $homeTabUser = $homeTab->getUser();
        $homeTabType = $homeTab->getType();

        if ($homeTabType !== 'desktop' || $user !== $homeTabUser) {

            throw new AccessDeniedException();
        }
    }

    private function checkWidgetHomeTabConfigEdition(User $authenticatedUser, WidgetHomeTabConfig $whtc)
    {
        $user = $whtc->getUser();

        if ($authenticatedUser !== $user) {

            throw new AccessDeniedException();
        }
    }

    private function checkWidgetDisplayConfigEdition(User $authenticatedUser, WidgetDisplayConfig $wdc)
    {
        $user = $wdc->getUser();

        if ($authenticatedUser !== $user) {

            throw new AccessDeniedException();
        }
    }

    private function checkWidgetInstanceEdition(User $authenticatedUser, WidgetInstance $widgetInstance)
    {
        $user = $widgetInstance->getUser();

        if ($authenticatedUser !== $user) {

            throw new AccessDeniedException();
        }
    }

    private function checkWidgetCreation(User $user, HomeTabConfig $htc)
    {
        $homeTab = $htc->getHomeTab();
        $homeTabUser = $homeTab->getUser();
        $type = $homeTab->getType();
        $locked = $htc->isLocked();
        $visible = $htc->isVisible();
        $canCreate = $visible &&
            !$locked &&
            (($type === 'desktop' && $homeTabUser === $user) || ($type === 'admin_desktop' && $visible && !$locked));

        if ($user === '.anon' || $this->roleManager->isHomeLocked($user) || !$canCreate) {

            throw new AccessDeniedException();
        }
    }

    private function hasUserAccessToWidgetInstance(User $authenticatedUser, WidgetInstance $widgetInstance)
    {
        $user = $widgetInstance->getUser();

        return $authenticatedUser === $user;
    }
}
