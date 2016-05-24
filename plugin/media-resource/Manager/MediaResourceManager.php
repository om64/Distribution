<?php

namespace Innova\MediaResourceBundle\Manager;

use Doctrine\ORM\EntityManager;
use Symfony\Component\Translation\TranslatorInterface;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Innova\MediaResourceBundle\Entity\MediaResource;
use Innova\MediaResourceBundle\Entity\Media;
use Innova\MediaResourceBundle\Entity\Options;
use JMS\DiExtraBundle\Annotation as DI;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\File\File;
use Claroline\CoreBundle\Entity\Workspace\Workspace;
use Symfony\Component\Filesystem\Filesystem;

/**
 * @DI\Service("innova_media_resource.manager.media_resource")
 */
class MediaResourceManager
{
    protected $em;
    protected $translator;
    protected $fileDir;
    //protected $tokenStorage;
    protected $claroUtils;
    protected $container;
    protected $workspaceManager;

    /**
     * @DI\InjectParams({
     *      "container"   = @DI\Inject("service_container"),
     *      "em"          = @DI\Inject("doctrine.orm.entity_manager"),
     *      "translator"  = @DI\Inject("translator"),
     *      "fileDir"     = @DI\Inject("%claroline.param.files_directory%")
     * })
     *
     * @param ContainerInterface  $container
     * @param EntityManager       $em
     * @param TranslatorInterface $translator
     * @param string              $fileDir
     */
    public function __construct(ContainerInterface $container, EntityManager $em, TranslatorInterface $translator, $fileDir)
    {
        $this->em = $em;
        $this->translator = $translator;
        $this->container = $container;
        $this->fileDir = $fileDir;
        $this->claroUtils = $container->get('claroline.utilities.misc');
        $this->workspaceManager = $container->get('claroline.manager.workspace_manager');
    }

    public function getRepository()
    {
        return $this->em->getRepository('InnovaMediaResourceBundle:MediaResource');
    }

    /**
     * Delete associated Media (removing from server hard drive) before deleting the entity.
     *
     * @param MediaResource $mr
     *
     * @return \Innova\MediaResourceBundle\Manager\MediaResourceManager
     */
    public function delete(MediaResource $mr)
    {
        // delete all files from server
        $medias = $mr->getMedias();
        foreach ($medias as $media) {
            $this->removeUpload($media->getUrl());
        }
        $this->em->remove($mr);
        $this->em->flush();

        return $this;
    }

    /**
     * Create default options for newly created MediaResource.
     **/
    public function createMediaResourceDefaultOptions(MediaResource $mr)
    {
        $options = new Options();
        $mr->setOptions($options);
    }

    /**
     * Create default options for newly created MediaResource.
     **/
    public function persist(MediaResource $mr)
    {
        $this->em->persist($mr);
        $this->em->flush();

        return $mr;
    }

    /**
     * Handle MediaResource associated files.
     *
     * @param UploadedFile  $file
     * @param MediaResource $mr
     * @param Workspace     $workspace
     */
    public function handleMediaResourceMedia(UploadedFile $file, MediaResource $mr, Workspace $workspace)
    {

        // final file upload dir
        $targetDir = '';
        if (!is_null($workspace)) {
            $targetDir = $this->workspaceManager->getStorageDirectory($workspace);
        } else {
            $targetDir = $this->fileDir.DIRECTORY_SEPARATOR.$this->tokenStorage->getToken()->getUsername();
        }

        // if the taget dir does not exist, create it
        $fs = new Filesystem();
        if (!$fs->exists($targetDir)) {
            $fs->mkdir($targetDir);
        }
        // set new filename
        $originalName = $file->getClientOriginalName();
        $ext = $file->getClientOriginalExtension();
        $uniqueBaseName = $this->claroUtils->generateGuid();

        // upload file
        if ($file->move($targetDir, $uniqueBaseName.'.'.$ext)) {
            // create Media Entity
            $media = new Media();
            $media->setType('audio');
            $media->setUrl('WORKSPACE_'.$workspace->getId().DIRECTORY_SEPARATOR.$uniqueBaseName.'.'.$ext);
            $mr->addMedia($media);
            $media->setMediaResource($mr);
            unset($file);
        } else {
            $message = $this->translator->trans('error_while_uploading', array(), 'media_resource');
            throw new \Exception($message);
        }

        return $mr;
    }

    public function copyMedia(MediaResource $mr, Media $origin)
    {
        $originalName = $origin->getUrl();
        $ext = pathinfo($origin->getUrl(), PATHINFO_EXTENSION);
        $newName = $this->claroUtils->generateGuid().'.'.$ext;
        $baseUrl = $this->container->getParameter('claroline.param.files_directory').DIRECTORY_SEPARATOR;
        // make a copy of the file
        if (copy($baseUrl.$origin->getUrl(), $baseUrl.$newName)) {
            // duplicate file
            $new = new Media();
            $new->setType($origin->getType());
            $new->setUrl($newName);
            $mr->addMedia($new);
            $this->em->persist($mr);
            $new->setMediaResource($mr);
        }
    }

    public function removeUpload($url)
    {
        $fullPath = $this->container->getParameter('claroline.param.files_directory')
           .DIRECTORY_SEPARATOR
           .$url;
        if (file_exists($fullPath)) {
            unlink($fullPath);

            return true;
        } else {
            return false;
        }
    }
}
