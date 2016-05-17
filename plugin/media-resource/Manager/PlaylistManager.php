<?php

namespace Innova\MediaResourceBundle\Manager;

use Doctrine\ORM\EntityManager;
use Symfony\Component\Translation\TranslatorInterface;
use Innova\MediaResourceBundle\Entity\Playlist;
use JMS\DiExtraBundle\Annotation as DI;

/**
 * @DI\Service("innova_media_resource.manager.playlist")
 */
class PlaylistManager
{
    protected $em;
    protected $translator;

    /**
     * @DI\InjectParams({
     *      "em"          = @DI\Inject("doctrine.orm.entity_manager"),
     *      "translator"  = @DI\Inject("translator")
     * })
     *
     * @param EntityManager       $em
     * @param TranslatorInterface $translator
     */
    public function __construct(EntityManager $em, TranslatorInterface $translator)
    {
        $this->em = $em;
        $this->translator = $translator;
    }

    public function save(Playlist $pl)
    {
        $this->em->persist($pl);
        $this->em->flush();

        return $pl;
    }

    public function getPlaylistRegionsInOrder(Playlist $playlist)
    {
        $qb = $this->em->createQueryBuilder();
        $qb->select('plr')
                ->from('Innova\MediaResourceBundle\Entity\PlaylistRegion', 'plr')
                ->where('plr.playlist = :playlistId')
                ->orderBy('plr.ordering', 'ASC')
                ->setParameter('playlistId', $playlist->getId());

        $query = $qb->getQuery();
        $result = $query->getResult();

        return $result;
    }
}
