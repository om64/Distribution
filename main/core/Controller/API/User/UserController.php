<?php

/*
 * This file is part of the Claroline Connect package.
 *
 * (c) Claroline Consortium <consortium@claroline.net>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Claroline\CoreBundle\Controller\API\User;

use Claroline\CoreBundle\Entity\Group;
use Claroline\CoreBundle\Entity\Role;
use Claroline\CoreBundle\Entity\User;
use Claroline\CoreBundle\Event\StrictDispatcher;
use Claroline\CoreBundle\Form\ProfileCreationType;
use Claroline\CoreBundle\Form\ProfileType;
use Claroline\CoreBundle\Library\Security\Collection\UserCollection;
use Claroline\CoreBundle\Manager\ApiManager;
use Claroline\CoreBundle\Manager\AuthenticationManager;
use Claroline\CoreBundle\Manager\GroupManager;
use Claroline\CoreBundle\Manager\LocaleManager;
use Claroline\CoreBundle\Manager\MailManager;
use Claroline\CoreBundle\Manager\ProfilePropertyManager;
use Claroline\CoreBundle\Manager\RoleManager;
use Claroline\CoreBundle\Manager\UserManager;
use Claroline\CoreBundle\Persistence\ObjectManager;
use FOS\RestBundle\Controller\Annotations\Get;
use FOS\RestBundle\Controller\Annotations\NamePrefix;
use FOS\RestBundle\Controller\Annotations\Post;
use FOS\RestBundle\Controller\Annotations\Put;
use FOS\RestBundle\Controller\Annotations\View;
use FOS\RestBundle\Controller\FOSRestController;
use JMS\DiExtraBundle\Annotation as DI;
use Nelmio\ApiDocBundle\Annotation\ApiDoc;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\ParamConverter;
use Symfony\Component\Form\FormFactory;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

/**
 * @NamePrefix("api_")
 */
class UserController extends FOSRestController
{
    /**
     * @DI\InjectParams({
     *     "authenticationManager"  = @DI\Inject("claroline.common.authentication_manager"),
     *     "formFactory"            = @DI\Inject("form.factory"),
     *     "eventDispatcher"        = @DI\Inject("claroline.event.event_dispatcher"),
     *     "localeManager"          = @DI\Inject("claroline.manager.locale_manager"),
     *     "request"                = @DI\Inject("request"),
     *     "roleManager"            = @DI\Inject("claroline.manager.role_manager"),
     *     "userManager"            = @DI\Inject("claroline.manager.user_manager"),
     *     "groupManager"           = @DI\Inject("claroline.manager.group_manager"),
     *     "om"                     = @DI\Inject("claroline.persistence.object_manager"),
     *     "profilePropertyManager" = @DI\Inject("claroline.manager.profile_property_manager"),
     *     "mailManager"            = @DI\Inject("claroline.manager.mail_manager"),
     *     "apiManager"             = @DI\Inject("claroline.manager.api_manager")
     * })
     */
    public function __construct(
        AuthenticationManager $authenticationManager,
        StrictDispatcher $eventDispatcher,
        FormFactory $formFactory,
        LocaleManager $localeManager,
        Request $request,
        UserManager $userManager,
        GroupManager $groupManager,
        RoleManager $roleManager,
        ObjectManager $om,
        ProfilePropertyManager $profilePropertyManager,
        MailManager $mailManager,
        ApiManager $apiManager
    ) {
        $this->authenticationManager = $authenticationManager;
        $this->eventDispatcher = $eventDispatcher;
        $this->formFactory = $formFactory;
        $this->localeManager = $localeManager;
        $this->request = $request;
        $this->userManager = $userManager;
        $this->groupManager = $groupManager;
        $this->roleManager = $roleManager;
        $this->om = $om;
        $this->userRepo = $om->getRepository('ClarolineCoreBundle:User');
        $this->roleRepo = $om->getRepository('ClarolineCoreBundle:Role');
        $this->groupRepo = $om->getRepository('ClarolineCoreBundle:Group');
        $this->profilePropertyManager = $profilePropertyManager;
        $this->mailManager = $mailManager;
        $this->apiManager = $apiManager;
    }

    /**
     * @View(serializerGroups={"api_user"})
     * @ApiDoc(
     *     description="Returns the users list",
     *     views = {"user"}
     * )
     * @Get("/users", name="users", options={ "method_prefix" = false })
     */
    public function getUsersAction()
    {
        $this->throwsExceptionIfNotAdmin();

        return $this->userManager->getAll();
    }

    /**
     * @View(serializerGroups={"api_user"})
     * @ApiDoc(
     *     description="Returns the users list",
     *     views = {"user"}
     * )
     * @Get("/users/page/{page}/limit/{limit}/search", name="get_search_users", options={ "method_prefix" = false })
     */
    public function getSearchUsersAction($page, $limit)
    {
        $data = [];
        $searches = $this->request->query->all();

        //format search
        foreach ($searches as $key => $search) {
            switch ($key) {
                case 'first_name': $data['firstName'] = $search; break;
                case 'last_name': $data['lastName'] = $search; break;
                case 'administrative_code': $data['administrativeCode'] = $search; break;
                case 'email': $data['mail'] = $search; break;
                default: $data[$key] = $search;
            }
        }

        $users = $this->userManager->searchPartialList($data, $page, $limit);
        $count = $this->userManager->searchPartialList($data, $page, $limit, true);

        return ['users' => $users, 'total' => $count];
    }

    /**
     * @ApiDoc(
     *     description="Returns the searchable user fields",
     *     views = {"user"}
     * )
     * @Get("/users/fields", name="get_user_fields", options={ "method_prefix" = false })
     */
    public function getUserFieldsAction()
    {
        return $this->userManager->getUserSearchableFields();
    }

    /**
     * @View(serializerGroups={"api_user"})
     * @ApiDoc(
     *     description="Creates a user",
     *     views = {"user"},
     *     input="Claroline\CoreBundle\Form\ProfileCreationType"
     * )
     */
    public function postUserAction()
    {
        $this->throwExceptionIfNotGranted('create', new User());
        $roleUser = $this->roleManager->getRoleByName('ROLE_USER');

        $profileType = new ProfileCreationType(
            $this->localeManager,
            [$roleUser],
            true,
            $this->authenticationManager->getDrivers()
        );
        $profileType->enableApi();

        $form = $this->formFactory->create($profileType);
        $form->submit($this->request);
        //$form->handleRequest($this->request);

        if ($form->isValid()) {
            //can we create the user in the current organization ?

            $roles = $form->get('platformRoles')->getData();
            $user = $form->getData();
            $user = $this->userManager->createUser($user, false, $roles);
            //maybe only do this if a parameter is present in platform_options.yml
            $this->mailManager->sendInitPassword($user);

            return $user;
        }

        return $form;
    }

    /**
     * @View(serializerGroups={"api_user"})
     * @ApiDoc(
     *     description="Update a user",
     *     views = {"user"},
     *     input="Claroline\CoreBundle\Form\ProfileType"
     * )
     * @ParamConverter("user", class="ClarolineCoreBundle:User", options={"repository_method" = "findForApi"})
     */
    public function putUserAction(User $user)
    {
        $this->throwExceptionIfNotGranted('edit', $user);
        $roles = $this->roleManager->getPlatformRoles($user);
        $accesses = $this->profilePropertyManager->getAccessessByRoles(['ROLE_ADMIN']);

        $formType = new ProfileType(
            $this->localeManager,
            $roles,
            true,
            true,
            $accesses,
            $this->authenticationManager->getDrivers()
        );

        $formType->enableApi();
        $userRole = $this->roleManager->getUserRoleByUser($user);
        $form = $this->formFactory->create($formType, $user);
        $form->submit($this->request);
        //$form->handleRequest($this->request);

        if ($form->isValid()) {
            $user = $form->getData();
            $this->roleManager->renameUserRole($userRole, $user->getUsername());
            $this->userManager->rename($user, $user->getUsername());

            if (isset($form['platformRoles'])) {
                //verification:
                //only the admin can grant the role admin
                //simple users cannot change anything. Don't let them put whatever they want with a fake form.
                $newRoles = $form['platformRoles']->getData();
                $this->userManager->setPlatformRoles($user, $newRoles);
            }

            return $user;
        }

        return $form;
    }

    /**
     * @View(serializerGroups={"api_user"})
     * @ApiDoc(
     *     description="Returns a user",
     *     views = {"user"}
     * )
     * @ParamConverter("user", class="ClarolineCoreBundle:User", options={"repository_method" = "findForApi"})
     * @Get("/user/{user}", name="get_user", options={ "method_prefix" = false })
     */
    public function getUserAction(User $user)
    {
        $this->throwsExceptionIfNotAdmin();

        return $user;
    }

    /**
     * @ApiDoc(
     *     description="Returns a user",
     *     views = {"user"}
     * )
     * @Get("/user/{user}/public", name="get_public_user", options={ "method_prefix" = false })
     */
    public function getPublicUserAction(User $user)
    {
        $settingsProfile = $this->profilePropertyManager->getAccessesForCurrentUser();
        $publicUser = [];

        foreach ($settingsProfile as $property => $isEditable) {
            if ($isEditable || $user === $this->container->get('security.token_storage')->getToken()->getUser()) {
                switch ($property) {
                    case 'administrativeCode':
                        $publicUser['administrativeCode'] = $user->getAdministrativeCode();
                        break;
                    case 'description':
                        $publicUser['description'] = $user->getAdministrativeCode();
                        break;
                    case 'email':
                        $publicUser['email'] = $user->getMail();
                        break;
                    case 'firstName':
                        $publicUser['firstName'] = $user->getFirstName();
                        break;
                    case 'lastName':
                        $publicUser['lastName'] = $user->getLastName();
                        break;
                    case 'phone':
                        $publicUser['phone'] = $user->getPhone();
                        break;
                    case 'picture':
                        $publicUser['picture'] = $user->getPicture();
                        break;
                    case 'username':
                        $publicUser['username'] = $user->getUsername();
                        break;
                }
            }
        }

        return $publicUser;
    }

    /**
     * @View()
     * @ApiDoc(
     *     description="Removes a user",
     *     section="user",
     *     views = {"api_user"}
     * )
     * @ParamConverter("user", class="ClarolineCoreBundle:User", options={"repository_method" = "findForApi"})
     */
    public function deleteUserAction(User $user)
    {
        $this->throwExceptionIfNotGranted('delete', $user);
        $this->userManager->deleteUser($user);

        return ['success'];
    }

    /**
     * @View()
     * @ApiDoc(
     *     description="Removes a list of users",
     *     views = {"group"},
     * )
     */
    public function deleteUsersAction()
    {
        $users = $this->apiManager->getParameters('userIds', 'Claroline\CoreBundle\Entity\User');
        $this->throwExceptionIfNotGranted('delete', $users);
        $this->container->get('claroline.persistence.object_manager')->startFlushSuite();

        foreach ($users as $user) {
            $this->userManager->deleteUser($user);
        }

        $this->container->get('claroline.persistence.object_manager')->endFlushSuite();

        return ['success'];
    }

    /**
     * @View(serializerGroups={"api_user"})
     * @ApiDoc(
     *     description="Add a role to a user",
     *     views = {"user"}
     * )
     * @ParamConverter("user", class="ClarolineCoreBundle:User", options={"repository_method" = "findForApi"})
     */
    public function addUserRoleAction(User $user, Role $role)
    {
        $this->throwExceptionIfNotGranted('edit', $user);
        $this->roleManager->associateRole($user, $role, false);

        return $user;
    }

    /**
     * @View(serializerGroups={"api_user"})
     * @Put("/users/roles/add", name="put_users_roles", options={ "method_prefix" = false })
     */
    public function putRolesToUsersAction()
    {
        $users = $this->apiManager->getParameters('userIds', 'Claroline\CoreBundle\Entity\User');
        $roles = $this->apiManager->getParameters('roleIds', 'Claroline\CoreBundle\Entity\Role');

        //later make a voter on a user list
        $this->throwsExceptionIfNotAdmin();
        $this->roleManager->associateRolesToSubjects($users, $roles);

        return $users;
    }

    /**
     * @View(serializerGroups={"api_user"})
     * @ApiDoc(
     *     description="remove a role from a user",
     *     views = {"user"}
     * )
     * @ParamConverter("user", class="ClarolineCoreBundle:User", options={"repository_method" = "findForApi"})
     */
    public function removeUserRoleAction(User $user, Role $role)
    {
        $this->throwExceptionIfNotGranted('edit', $user);
        $this->roleManager->dissociateRole($user, $role);

        return $user;
    }

    /**
     * @View(serializerGroups={"api_user"})
     * @ApiDoc(
     *     description="Add a user in a group",
     *     views = {"user"}
     * )
     * @ParamConverter("user", class="ClarolineCoreBundle:User", options={"repository_method" = "findForApi"})
     */
    public function addUserGroupAction(User $user, Group $group)
    {
        $this->throwExceptionIfNotGranted('edit', $user);
        $this->groupManager->addUsersToGroup($group, [$user]);

        return $user;
    }

    /**
     * @View(serializerGroups={"api_user"})
     * @ApiDoc(
     *     description="Remove a user from a group",
     *     views = {"user"}
     * )
     * @ParamConverter("user", class="ClarolineCoreBundle:User", options={"repository_method" = "findForApi"})
     */
    public function removeUserGroupAction(User $user, Group $group)
    {
        $this->throwExceptionIfNotGranted('edit', $user);
        $this->groupManager->removeUsersFromGroup($group, [$user]);

        return $user;
    }

    /**
     * @View()
     * @ApiDoc(
     *     description="Returns the list of actions an admin can do on a user",
     *     views = {"user"}
     * )
     * @Get("/user/admin/action", name="get_user_admin_actions", options={ "method_prefix" = false })
     */
    public function getUserAdminActionsAction()
    {
        return $this->om->getRepository('Claroline\CoreBundle\Entity\Action\AdditionalAction')->findByType('admin_user_action');
    }

    /**
     * @View()
     * @ApiDoc(
     *     description="Send the password initialization message for a user.",
     *     views = {"user"}
     * )
     */
    public function usersPasswordInitializeAction()
    {
        $users = $this->apiManager->getParameters('userIds', 'Claroline\CoreBundle\Entity\User');
        $this->throwExceptionIfNotGranted('edit', $users);

        foreach ($users as $user) {
            $this->mailManager->sendForgotPassword($user);
        }

        return ['success'];
    }

    /**
     * @View(serializerGroups={"api_user"})
     * @ApiDoc(
     *     description="Add a list of users to a group",
     *     views = {"group"},
     * )
     */
    public function addUsersToGroupAction(Group $group)
    {
        $users = $this->apiManager->getParameters('userIds', 'Claroline\CoreBundle\Entity\User');
        $this->throwExceptionIfNotGranted('edit', $users);
        $users = $this->groupManager->addUsersToGroup($group, $users);

        return $users;
    }

    /**
     * @View(serializerGroups={"api_user"})
     * @ApiDoc(
     *     description="Removes a list of users from a group",
     *     views = {"group"},
     * )
     */
    public function removeUsersFromGroupAction(Group $group)
    {
        $users = $this->apiManager->getParameters('userIds', 'Claroline\CoreBundle\Entity\User');
        $this->throwExceptionIfNotGranted('edit', $users);
        $this->groupManager->removeUsersFromGroup($group, $users);

        return $users;
    }

    /**
     * @View(serializerGroups={"api_user"})
     * @ApiDoc(
     *     description="Removes user by csv",
     *     views = {"user"}
     * )
     * @Post("/users/csv/remove")
     */
    public function csvRemoveUserAction()
    {
        $this->throwsExceptionIfNotAdmin();

        $this->userManager->csvRemove($this->request->files->get('csv'));
    }

    /**
     * @View(serializerGroups={"api_user"})
     * @Post("/user/{user}/disable", name="disable_user", options={ "method_prefix" = false })
     */
    public function disableUserAction(User $user)
    {
        $this->throwsExceptionIfNotAdmin();

        return $this->userManager->disable($user);
    }

    /**
     * @View(serializerGroups={"api_user"})
     * @Post("/user/{user}/enable", name="enable_user", options={ "method_prefix" = false })
     */
    public function enableUserAction(User $user)
    {
        $this->throwsExceptionIfNotAdmin();

        return $this->userManager->enable($user);
    }

     /**
      * @View(serializerGroups={"api_user"})
      * @Post("/users/csv/facets")
      */
     public function csvImportFacetsAction()
     {
         $this->throwsExceptionIfNotAdmin();

         $this->userManager->csvFacets($this->request->files->get('csv'));
     }

    private function isAdmin()
    {
        return $this->container->get('security.authorization_checker')->isGranted('ROLE_ADMIN');
    }

    private function throwsExceptionIfNotAdmin()
    {
        if (!$this->isAdmin()) {
            throw new AccessDeniedException('This action can only be done by the administrator');
        }
    }

    private function isUserGranted($action, $object)
    {
        return $this->container->get('security.authorization_checker')->isGranted($action, $object);
    }

    private function throwExceptionIfNotGranted($action, $users)
    {
        $collection = is_array($users) ? new UserCollection($users) : new UserCollection([$users]);
        $isGranted = $this->isUserGranted($action, $collection);

        if (!$isGranted) {
            $userlist = '';

            foreach ($collection->getUsers() as $user) {
                $userlist .= "[{$user->getUsername()}]";
            }
            throw new AccessDeniedException("You can't do the action [{$action}] on the user list {$userlist}");
        }
    }
}
