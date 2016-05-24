<?php

namespace Innova\MediaResourceBundle\Controller;

use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Method;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\ParamConverter;
use Innova\MediaResourceBundle\Entity\MediaResource;
use Claroline\CoreBundle\Entity\Workspace\Workspace;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Innova\MediaResourceBundle\Form\Type\OptionsType;
use Innova\MediaResourceBundle\Entity\Options;

/**
 * Class MediaResourceController.
 *
 * @Route("workspaces/{workspaceId}")
 * @ParamConverter("workspace", class="ClarolineCoreBundle:Workspace\Workspace", options={"mapping": {"workspaceId": "id"}})
 */
class MediaResourceController extends Controller
{
    /**
     * display a media resource.
     *
     * @Route("/view/{id}", requirements={"id" = "\d+"}, name="innova_media_resource_open")
     * @Method("GET")
     * @ParamConverter("MediaResource", class="InnovaMediaResourceBundle:MediaResource")
     */
    public function openAction(Workspace $workspace, MediaResource $mr)
    {
        if (false === $this->container->get('security.context')->isGranted('OPEN', $mr->getResourceNode())) {
            throw new AccessDeniedException();
        }
        // use of specific method to order regions correctly
        $regions = $this->get('innova_media_resource.manager.media_resource_region')->findByAndOrder($mr);
        // get options
        $options = $mr->getOptions();
        // if set to exercise view all the other parameters are ignored
        if ($options->getShowExerciseView()) {
            return $this->render('InnovaMediaResourceBundle:MediaResource:player.exercise.html.twig', array(
                        '_resource' => $mr,
                        'regions' => $regions,
                        'workspace' => $workspace,
                            )
            );
        } else {
            $modes = [];
            // at least one mode is enabled
            if ($options->getShowAutoPauseView) {
                array_push($modes, 'pause');
            }
            if ($options->getShowActiveView) {
                array_push($modes, 'active');
            }
            if ($options->getShowLiveView) {
                array_push($modes, 'live');
            }

            return $this->render('InnovaMediaResourceBundle:MediaResource:player.wrapper.html.twig', array(
                      '_resource' => $mr,
                      'regions' => $regions,
                      'workspace' => $workspace,
                      'mode' => $modes[0],
                  )
          );
        }
    }

    /**
     * Media resource player other views.
     *
     * @Route("/mr/{id}/mode/{mode}", requirements={"id" = "\d+"}, name="media_resource_change_view")
     * @ParamConverter("MediaResource", class="InnovaMediaResourceBundle:MediaResource")
     * @Method("GET")
     */
    public function changeViewAction(Workspace $workspace, MediaResource $mr)
    {
        if (false === $this->container->get('security.context')->isGranted('OPEN', $mr->getResourceNode())) {
            throw new AccessDeniedException();
        }

        // use a specific method to order regions correctly
        $regions = $this->get('innova_media_resource.manager.media_resource_region')->findByAndOrder($mr);
        $mode = $this->getRequest()->get('mode');

        return $this->render('InnovaMediaResourceBundle:MediaResource:player.wrapper.html.twig', array(
                  '_resource' => $mr,
                  'regions' => $regions,
                  'workspace' => $workspace,
                  'mode' => $mode,
                      )
                    );
    }

    /**
     * administrate a media resource.
     *
     * @Route("/edit/{id}", requirements={"id" = "\d+"}, name="innova_media_resource_administrate")
     * @Method("GET")
     * @ParamConverter("MediaResource", class="InnovaMediaResourceBundle:MediaResource")
     */
    public function administrateAction(Workspace $workspace, MediaResource $mr)
    {
        if (false === $this->container->get('security.context')->isGranted('ADMINISTRATE', $mr->getResourceNode())) {
            throw new AccessDeniedException();
        }

        // use of specific method to order regions correctly
        $regions = $this->get('innova_media_resource.manager.media_resource_region')->findByAndOrder($mr);
        $options = $mr->getOptions();
        // MediaResource Options form
        $form = $this->container->get('form.factory')->create(new OptionsType(), $options);

        return $this->render('InnovaMediaResourceBundle:MediaResource:administrate.html.twig', array(
                    '_resource' => $mr,
                    'regions' => $regions,
                    'workspace' => $workspace,
                    'form' => $form->createView(),
          )
        );
    }

    /**
     * AJAX administrate media resource options.
     *
     * @Route("/mr/{id}/options/edit", requirements={"id" = "\d+"}, name="media_resource_save_options")
     * @Method("POST")
     * @ParamConverter("MediaResource", class="InnovaMediaResourceBundle:MediaResource")
     */
    public function saveOptionsAction(MediaResource $mr)
    {
        $form = $this->container->get('form.factory')->create(new OptionsType(), $mr->getOptions());
        // Try to process form
        $request = $this->container->get('request');
        $form->handleRequest($request);
        $msg = '';
        $code = 200;
        if ($form->isValid()) {
            $options = $form->getData();
            $mr->setOptions($options);
            $mr = $this->get('innova_media_resource.manager.media_resource')->persist($mr);
            $msg = $this->get('translator')->trans('config_update_success', array(), 'media_resource');
        } else {
            $msg = $this->get('translator')->trans('config_update_error', array(), 'media_resource');
            $code = 500;
        }

        return new JsonResponse($msg, $code);
    }

    /**
     * AJAX
     * save media resource regions.
     *
     * @Route("/save/{id}", requirements={"id" = "\d+"}, name="media_resource_save")
     * @ParamConverter("MediaResource", class="InnovaMediaResourceBundle:MediaResource")
     *  @Method({"POST"})
     */
    public function saveAction(MediaResource $mr)
    {
        $request = $this->container->get('request');
        $data = $request->request->all();
        if (count($data) > 0) {
            $regionManager = $this->get('innova_media_resource.manager.media_resource_region');
            $mediaResource = $regionManager->handleMediaResourceRegions($mr, $data);
            if ($mediaResource) {
                $msg = $this->get('translator')->trans('resource_update_success', array(), 'media_resource');

                return new JsonResponse($msg, 200);
            } else {
                $msg = $this->get('translator')->trans('resource_update_error', array(), 'media_resource');

                return new JsonResponse($msg, 500);
            }
        }
    }

    /**
     * Serve a ressource file that is not in the web folder as a base64 string.
     *
     * @Route(
     *     "/get/media/{id}",
     *     name="innova_get_mediaresource_resource_file",
     *     options={"expose"=true}
     * )
     * @ParamConverter("MediaResource", class="InnovaMediaResourceBundle:MediaResource")
     * @Method({"GET", "POST"})
     */
    public function serveMediaResourceFile(MediaResource $mr)
    {
        $fileUrl = $this->get('innova_media_resource.manager.media_resource_media')->getAudioMediaUrlForAjax($mr);
        $path = $this->container->getParameter('claroline.param.files_directory')
            .DIRECTORY_SEPARATOR
            .$fileUrl;
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $type = $finfo->file($path);
        $response = new BinaryFileResponse($path);
        $response->headers->set('Content-Type', $type);

        return $response;
    }

    /**
     * get media resource media url.
     *
     * @Route(
     *     "/get/media/{id}/url",
     *     name="innova_get_mediaresource_resource_file_url",
     *     options={"expose"=true}
     * )
     * @ParamConverter("MediaResource", class="InnovaMediaResourceBundle:MediaResource")
     * @Method({"GET"})
     */
    public function getMediaResourceMediaUrl(MediaResource $mr)
    {
        $fileUrl = $this->get('innova_media_resource.manager.media_resource_media')->getAudioMediaUrlForAjax($mr);
        $path = $this->container->getParameter('claroline.param.files_directory')
            .DIRECTORY_SEPARATOR
            .$fileUrl;

        return $path;
    }
}
