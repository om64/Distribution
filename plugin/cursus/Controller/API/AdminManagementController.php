<?php

/*
 * This file is part of the Claroline Connect package.
 *
 * (c) Claroline Consortium <consortium@claroline.net>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Claroline\CursusBundle\Controller\API;

use Claroline\CoreBundle\Entity\User;
use Claroline\CoreBundle\Manager\ApiManager;
use Claroline\CursusBundle\Entity\Course;
use Claroline\CursusBundle\Entity\Cursus;
use Claroline\CursusBundle\Event\Log\LogCourseCreateEvent;
use Claroline\CursusBundle\Event\Log\LogCursusCreateEvent;
use Claroline\CursusBundle\Event\Log\LogCursusDeleteEvent;
use Claroline\CursusBundle\Event\Log\LogCursusEditEvent;
use Claroline\CursusBundle\Form\CourseType;
use Claroline\CursusBundle\Form\CursusType;
use Claroline\CursusBundle\Form\FileSelectType;
use Claroline\CursusBundle\Manager\CursusManager;
use JMS\DiExtraBundle\Annotation as DI;
use JMS\SecurityExtraBundle\Annotation as SEC;
use JMS\Serializer\SerializationContext;
use JMS\Serializer\Serializer;
use Sensio\Bundle\FrameworkExtraBundle\Configuration as EXT;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;
use Symfony\Component\Form\FormError;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Translation\TranslatorInterface;

/**
 * @DI\Tag("security.secure_service")
 * @SEC\PreAuthorize("canOpenAdminTool('claroline_cursus_tool')")
 */
class AdminManagementController extends Controller
{
    private $apiManager;
    private $cursusManager;
    private $eventDispatcher;
    private $request;
    private $serializer;
    private $translator;

    /**
     * @DI\InjectParams({
     *     "apiManager"      = @DI\Inject("claroline.manager.api_manager"),
     *     "cursusManager"   = @DI\Inject("claroline.manager.cursus_manager"),
     *     "eventDispatcher" = @DI\Inject("event_dispatcher"),
     *     "request"         = @DI\Inject("request"),
     *     "serializer"      = @DI\Inject("jms_serializer"),
     *     "translator"      = @DI\Inject("translator")
     * })
     */
    public function __construct(
        ApiManager $apiManager,
        CursusManager $cursusManager,
        EventDispatcherInterface $eventDispatcher,
        Request $request,
        Serializer $serializer,
        TranslatorInterface $translator
    ) {
        $this->apiManager = $apiManager;
        $this->cursusManager = $cursusManager;
        $this->eventDispatcher = $eventDispatcher;
        $this->request = $request;
        $this->serializer = $serializer;
        $this->translator = $translator;
    }

    /**
     * @EXT\Route(
     *     "/admin/management/index",
     *     name="claro_cursus_admin_management_index"
     * )
     * @EXT\ParamConverter("authenticatedUser", options={"authenticatedUser" = true})
     * @EXT\Template()
     */
    public function indexAction()
    {
        return [];
    }

    /**
     * @EXT\Route(
     *     "/api/cursus/create/form",
     *     name="api_get_cursus_creation_form",
     *     options = {"expose"=true}
     * )
     * @EXT\ParamConverter("user", options={"authenticatedUser" = true})
     *
     * Returns cursus creation form
     */
    public function getCursusCreationFormAction()
    {
        $formType = new CursusType();
        $formType->enableApi();
        $form = $this->createForm($formType);

        return $this->apiManager->handleFormView(
            'ClarolineCursusBundle:API:AdminManagement\CursusCreateForm.html.twig',
            $form
        );
    }

    /**
     * @EXT\Route(
     *     "/api/cursus/create",
     *     name="api_post_cursus_creation",
     *     options = {"expose"=true}
     * )
     * @EXT\ParamConverter("user", options={"authenticatedUser" = true})
     *
     * Creates a cursus
     *
     * @return \Symfony\Component\HttpFoundation\JsonResponse
     */
    public function postCursusCreationAction()
    {
        $formType = new CursusType();
        $formType->enableApi();
        $cursus = new Cursus();
        $form = $this->createForm($formType, $cursus);
        $form->submit($this->request);

        if ($form->isValid()) {
            $orderMax = $this->cursusManager->getLastRootCursusOrder();
            $order = is_null($orderMax) ? 1 : intval($orderMax) + 1;
            $cursus->setCursusOrder($order);
            $color = $form->get('color')->getData();
            $cursus->setDetails(['color' => $color]);
            $this->cursusManager->persistCursus($cursus);
            $event = new LogCursusCreateEvent($cursus);
            $this->eventDispatcher->dispatch('log', $event);
            $serializedCursus = $this->serializer->serialize(
                $cursus,
                'json',
                SerializationContext::create()->setGroups(['api_cursus'])
            );

            return new JsonResponse($serializedCursus, 200);
        } else {
            $options = [
                'http_code' => 400,
                'extra_parameters' => null,
                'serializer_group' => 'api_cursus',
            ];

            return $this->apiManager->handleFormView(
                'ClarolineCursusBundle:API:AdminManagement\CursusCreateForm.html.twig',
                $form,
                $options
            );
        }
    }

    /**
     * @EXT\Route(
     *     "/api/cursus/{parent}/child/create",
     *     name="api_post_cursus_child_creation",
     *     options = {"expose"=true}
     * )
     * @EXT\ParamConverter("user", options={"authenticatedUser" = true})
     *
     * Creates a child cursus
     *
     * @return \Symfony\Component\HttpFoundation\JsonResponse
     */
    public function postCursusChildCreationAction(Cursus $parent)
    {
        $formType = new CursusType();
        $formType->enableApi();
        $cursus = new Cursus();
        $form = $this->createForm($formType, $cursus);
        $form->submit($this->request);

        if ($form->isValid()) {
            $cursus->setParent($parent);
            $orderMax = $this->cursusManager->getLastCursusOrderByParent($parent);
            $order = is_null($orderMax) ? 1 : intval($orderMax) + 1;
            $cursus->setCursusOrder($order);
            $color = $form->get('color')->getData();
            $cursus->setDetails(['color' => $color]);
            $this->cursusManager->persistCursus($cursus);
            $event = new LogCursusCreateEvent($cursus);
            $this->eventDispatcher->dispatch('log', $event);
            $serializedCursus = $this->serializer->serialize(
                $cursus,
                'json',
                SerializationContext::create()->setGroups(['api_cursus'])
            );

            return new JsonResponse($serializedCursus, 200);
        } else {
            $options = [
                'http_code' => 400,
                'extra_parameters' => null,
                'serializer_group' => 'api_cursus',
            ];

            return $this->apiManager->handleFormView(
                'ClarolineCursusBundle:API:AdminManagement\CursusCreateForm.html.twig',
                $form,
                $options
            );
        }
    }

    /**
     * @EXT\Route(
     *     "/api/cursus/{cursus}/edit/form",
     *     name="api_get_cursus_edition_form",
     *     options = {"expose"=true}
     * )
     * @EXT\ParamConverter("user", options={"authenticatedUser" = true})
     *
     * Returns the cursus edition form
     *
     * @return \Symfony\Component\HttpFoundation\JsonResponse
     */
    public function getCursusEditionFormAction(Cursus $cursus)
    {
        $formType = new CursusType($cursus);
        $formType->enableApi();
        $form = $this->createForm($formType, $cursus);

        return $this->apiManager->handleFormView(
            'ClarolineCursusBundle:API:AdminManagement\CursusEditForm.html.twig',
            $form
        );
    }
    /**
     * @EXT\Route(
     *     "/api/cursus/{cursus}/edit",
     *     name="api_put_cursus_edition",
     *     options = {"expose"=true}
     * )
     * @EXT\ParamConverter("user", options={"authenticatedUser" = true})
     *
     * Edits a cursus
     *
     * @return \Symfony\Component\HttpFoundation\JsonResponse
     */
    public function putCursusEditionAction(Cursus $cursus)
    {
        $formType = new CursusType($cursus);
        $formType->enableApi();
        $form = $this->createForm($formType, $cursus);
        $form->submit($this->request);

        if ($form->isValid()) {
            $color = $form->get('color')->getData();
            $details = $cursus->getDetails();

            if (is_null($details)) {
                $details = [];
            }
            $details['color'] = $color;
            $cursus->setDetails($details);
            $this->cursusManager->persistCursus($cursus);
            $event = new LogCursusEditEvent($cursus);
            $this->eventDispatcher->dispatch('log', $event);
            $serializedCursus = $this->serializer->serialize(
                $cursus,
                'json',
                SerializationContext::create()->setGroups(['api_cursus'])
            );

            return new JsonResponse($serializedCursus, 200);
        } else {
            $options = [
                'http_code' => 400,
                'extra_parameters' => null,
                'serializer_group' => 'api_cursus',
            ];

            return $this->apiManager->handleFormView(
                'ClarolineCursusBundle:API:AdminManagement\CursusEditForm.html.twig',
                $form,
                $options
            );
        }
    }

    /**
     * @EXT\Route(
     *     "/api/cursus/{cursus}/delete",
     *     name="api_delete_cursus",
     *     options = {"expose"=true}
     * )
     * @EXT\ParamConverter("user", options={"authenticatedUser" = true})
     *
     * Deletes cursus
     *
     * @return \Symfony\Component\HttpFoundation\JsonResponse
     */
    public function deleteCursusAction(Cursus $cursus)
    {
        $details = [];
        $details['id'] = $cursus->getId();
        $details['title'] = $cursus->getTitle();
        $details['code'] = $cursus->getCode();
        $details['blocking'] = $cursus->isBlocking();
        $details['details'] = $cursus->getDetails();
        $details['root'] = $cursus->getRoot();
        $details['lvl'] = $cursus->getLvl();
        $details['lft'] = $cursus->getLft();
        $details['rgt'] = $cursus->getRgt();
        $parent = $cursus->getParent();
        $course = $cursus->getCourse();
        $workspace = $cursus->getWorkspace();

        if (!is_null($parent)) {
            $details['parentId'] = $parent->getId();
            $details['parentTitle'] = $parent->getTitle();
            $details['parentCode'] = $parent->getCode();
        }

        if (!is_null($course)) {
            $details['courseId'] = $course->getId();
            $details['courseTitle'] = $course->getTitle();
            $details['courseCode'] = $course->getCode();
        }

        if (!is_null($workspace)) {
            $details['workspaceId'] = $workspace->getId();
            $details['workspaceName'] = $workspace->getName();
            $details['workspaceCode'] = $workspace->getCode();
            $details['workspaceGuid'] = $workspace->getGuid();
        }
        $serializedCursus = $this->serializer->serialize(
            $cursus,
            'json',
            SerializationContext::create()->setGroups(['api_cursus'])
        );
        $this->cursusManager->deleteCursus($cursus);
        $event = new LogCursusDeleteEvent($details);
        $this->eventDispatcher->dispatch('log', $event);

        return new JsonResponse($serializedCursus, 200);
    }

    /**
     * @EXT\Route(
     *     "/api/cursus/import",
     *     name="api_post_cursus_import",
     *     options={"expose"=true}
     * )
     * @EXT\ParamConverter("authenticatedUser", options={"authenticatedUser" = true})
     */
    public function postCursusImportAction()
    {
        $file = $this->request->files->get('archive');
        $zip = new \ZipArchive();

        if (empty($file) || !$zip->open($file) || !$zip->getStream('cursus.json') || !$zip->getStream('courses.json')) {

            return new JsonResponse('invalid file', 500);
        }
        $coursesStream = $zip->getStream('courses.json');
        $coursesContents = '';

        while (!feof($coursesStream)) {
            $coursesContents .= fread($coursesStream, 2);
        }
        fclose($coursesStream);
        $courses = json_decode($coursesContents, true);
        $importedCourses = $this->cursusManager->importCourses($courses);

        $iconsDir = $this->container->getParameter('claroline.param.thumbnails_directory').'/';

        for ($i = 0; $i < $zip->numFiles; ++$i) {
            $name = $zip->getNameIndex($i);

            if (strpos($name, 'icons/') !== 0) {
                continue;
            }
            $iconFileName = $iconsDir.substr($name, 6);
            $stream = $zip->getStream($name);
            $destStream = fopen($iconFileName, 'w');

            while ($data = fread($stream, 1024)) {
                fwrite($destStream, $data);
            }
            fclose($stream);
            fclose($destStream);
        }
        $cursusStream = $zip->getStream('cursus.json');
        $cursuscontents = '';

        while (!feof($cursusStream)) {
            $cursuscontents .= fread($cursusStream, 2);
        }
        fclose($cursusStream);
        $zip->close();
        $cursus = json_decode($cursuscontents, true);
        $rootCursus = $this->cursusManager->importCursus($cursus, $importedCourses);
        $serializedCursus = $this->serializer->serialize(
            $rootCursus,
            'json',
            SerializationContext::create()->setGroups(['api_cursus'])
        );

        return new JsonResponse($serializedCursus, 200);
    }

    /**
     * @EXT\Route(
     *     "/api/course/create/form",
     *     name="api_get_course_creation_form",
     *     options = {"expose"=true}
     * )
     * @EXT\ParamConverter("user", options={"authenticatedUser" = true})
     *
     * Returns course creation form
     */
    public function getCourseCreationFormAction(User $user)
    {
        $formType = new CourseType($user, $this->cursusManager, $this->translator);
        $formType->enableApi();
        $course = new Course();
        $form = $this->createForm($formType, $course);

        return $this->apiManager->handleFormView(
            'ClarolineCursusBundle:API:AdminManagement\CourseCreateForm.html.twig',
            $form
        );
    }

    /**
     * @EXT\Route(
     *     "/api/cursus/{cursus}/course/create/form",
     *     name="api_post_cursus_course_creation",
     *     options = {"expose"=true}
     * )
     * @EXT\ParamConverter("user", options={"authenticatedUser" = true})
     */
    public function postCursusCourseCreateAction(User $user, Cursus $cursus)
    {
        $formType = new CourseType($user, $this->cursusManager, $this->translator);
        $formType->enableApi();
        $course = new Course();
        $form = $this->createForm($formType, $course);
        $form->submit($this->request);

        if ($form->isValid()) {
//            $icon = $form->get('icon')->getData();
//
//            if (!is_null($icon)) {
//                $hashName = $this->cursusManager->saveIcon($icon);
//                $course->setIcon($hashName);
//            }
            $this->cursusManager->persistCourse($course);
            $createdCursus = $this->cursusManager->addCoursesToCursus($cursus, [$course]);
            $event = new LogCourseCreateEvent($course);
            $this->eventDispatcher->dispatch('log', $event);
            $serializedCursus = $this->serializer->serialize(
                $createdCursus,
                'json',
                SerializationContext::create()->setGroups(['api_cursus'])
            );

            return new JsonResponse($serializedCursus, 200);
        } else {
            $options = [
                'http_code' => 400,
                'extra_parameters' => null,
                'serializer_group' => 'api_cursus',
            ];

            return $this->apiManager->handleFormView(
                'ClarolineCursusBundle:API:AdminManagement\CourseCreateForm.html.twig',
                $form,
                $options
            );
        }
    }

    /**
     * @EXT\Route(
     *     "/api/cursus/{cursus}/course/{course}/add",
     *     name="api_post_cursus_course_add",
     *     options = {"expose"=true}
     * )
     * @EXT\ParamConverter("user", options={"authenticatedUser" = true})
     */
    public function postCursusCourseAddAction(Cursus $cursus, Course $course)
    {
        $createdCursus = $this->cursusManager->addCoursesToCursus($cursus, [$course]);
        $serializedCursus = $this->serializer->serialize(
            $createdCursus,
            'json',
            SerializationContext::create()->setGroups(['api_cursus'])
        );

        return new JsonResponse($serializedCursus, 200);
    }
}
