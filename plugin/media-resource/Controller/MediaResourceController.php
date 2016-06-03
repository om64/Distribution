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
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Innova\MediaResourceBundle\Form\Type\OptionsType;
use Innova\MediaResourceBundle\Entity\Options;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;

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
        //echo $mode;
        //die;

        return $this->render('InnovaMediaResourceBundle:MediaResource:player.wrapper.html.twig', array(
                  '_resource' => $mr,
                  'regions' => $regions,
                  'workspace' => $workspace,
                  'mode' => $options->getMode(),
              )
      );
    }

    /**
     * administrate a media resource.
     *
     * @Route("/mr/edit/{id}", requirements={"id" = "\d+"}, name="innova_media_resource_administrate")
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
     * Create a zip that contains :
     * - the original file
     * - .srt file (might be empty)
     * - all regions as audio files.
     *
     * @Route(
     *     "/media/{id}/zip",
     *     name="mediaresource_zip_export",
     *     options={"expose"=true}
     * )
     * @ParamConverter("MediaResource", class="InnovaMediaResourceBundle:MediaResource")
     * @Method({"GET"})
     */
    public function exportToZip(MediaResource $resource)
    {
        $data = $this->container->get('request')->query->get('data');

        $zipPath = $this->get('innova_media_resource.manager.media_resource')->exportToZip($resource, $data);

        $response = new Response();
        $response->headers->set('Content-Transfer-Encoding', 'octet-stream');
        $response->headers->set('Content-Type', 'application/force-download');
        $response->headers->set('Content-Disposition', 'attachment; filename='.urlencode('archive.zip'));
        $response->headers->set('Content-Type', 'application/zip');
        $response->headers->set('Connection', 'close');
        $response->sendHeaders();

        $response->setContent(readfile($zipPath));

        return $response;

      /*  $response = new BinaryFileResponse($zipPath);
        $response->setContentDisposition(ResponseHeaderBag::DISPOSITION_ATTACHMENT);

        $response->headers->set('Content-Type', 'application/zip');

        return $response;*/
    }
}
