<?php

namespace Innova\MediaResourceBundle\Controller;

use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Method;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\ParamConverter;
use Innova\MediaResourceBundle\Entity\MediaResource;
use Claroline\CoreBundle\Entity\Workspace\Workspace;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

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
        // default view is AutoPause !
        return $this->render('InnovaMediaResourceBundle:MediaResource:player.pause.html.twig', array(
                    '_resource' => $mr,
                    'regions' => $regions,
                    'workspace' => $workspace,
                        )
        );
    }

    /**
     * Media resource player other views.
     *
     * @Route("/mode/{id}", requirements={"id" = "\d+"}, name="media_resource_change_view")
     * @ParamConverter("MediaResource", class="InnovaMediaResourceBundle:MediaResource")
     * @Method("POST")
     */
    public function changeViewAction(Workspace $workspace, MediaResource $mr)
    {
        if (false === $this->container->get('security.context')->isGranted('OPEN', $mr->getResourceNode())) {
            throw new AccessDeniedException();
        }

        // use a specific method to order regions correctly
        $regions = $this->get('innova_media_resource.manager.media_resource_region')->findByAndOrder($mr);

        $active = $this->getRequest()->get('active');
        $live = $this->getRequest()->get('live');
        $exercise = $this->getRequest()->get('exercise');

        if ($active) {
            return $this->render('InnovaMediaResourceBundle:MediaResource:details.html.twig', array(
                            '_resource' => $mr,
                            'edit' => false,
                            'regions' => $regions,
                            'workspace' => $workspace,
                                )
                );
        } elseif ($live) {
            return $this->render('InnovaMediaResourceBundle:MediaResource:player.live.html.twig', array(
                            '_resource' => $mr,
                            'regions' => $regions,
                            'workspace' => $workspace,
                                )
                );
        } elseif ($exercise) {
            return $this->render('InnovaMediaResourceBundle:MediaResource:player.exercise.html.twig', array(
                          '_resource' => $mr,
                          'regions' => $regions,
                          'workspace' => $workspace,
                              )
              );
        } else {
            $url = $this->generateUrl('innova_media_resource_open', array('id' => $mr->getId(), 'workspaceId' => $workspace->getId()));

            return $this->redirect($url);
        }
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

        return $this->render('InnovaMediaResourceBundle:MediaResource:details.html.twig', array(
                    '_resource' => $mr,
                    'edit' => true,
                    'regions' => $regions,
                    'workspace' => $workspace,
                    'playMode' => 'active',
                        )
        );
    }

    /**
     * AJAX
     * save a media resource after editing (adding and/or configuring regions).
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

                return new \Symfony\Component\HttpFoundation\Response($msg, 200);
            } else {
                $msg = $this->get('translator')->trans('resource_update_error', array(), 'media_resource');

                return new \Symfony\Component\HttpFoundation\Response($msg, 500);
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
