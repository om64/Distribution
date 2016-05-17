<?php

namespace Innova\MediaResourceBundle\Manager;

use Doctrine\ORM\EntityManager;
use Symfony\Component\Translation\TranslatorInterface;
use Innova\MediaResourceBundle\Entity\PlaylistRegion;
use Innova\MediaResourceBundle\Entity\Playlist;
use JMS\DiExtraBundle\Annotation as DI;

/**
 * @DI\Service("innova_media_resource.manager.playlist_region")
 */
class PlaylistRegionManager
{
    protected $em;
    protected $translator;
    protected $playlistManager;

    /**
     * @DI\InjectParams({
     *      "em"          = @DI\Inject("doctrine.orm.entity_manager"),
     *      "translator"  = @DI\Inject("translator"),
     *      "plManager"     = @DI\Inject("innova_media_resource.manager.playlist")
     * })
     *
     * @param EntityManager       $em
     * @param TranslatorInterface $translator
     * @param PlaylistManager     $plManager
     */
    public function __construct(EntityManager $em, TranslatorInterface $translator, PlaylistManager $plManager)
    {
        $this->em = $em;
        $this->translator = $translator;
        $this->playlistManager = $plManager;
    }

    public function save(PlaylistRegion $plRegion)
    {
        $this->em->persist($plRegion);
        $this->em->flush();

        return $plRegion;
    }

    public function delete(PlaylistRegion $plRegion)
    {
        $this->em->remove($plRegion);
        $this->em->flush();
    }

    /**
     * After deleting a region and by cascade a playlist region entry
     * we need to reorder all playlist regions.
     */
    public function reorder($playlistRegions)
    {
        $current = null; // current playlist (a region can belong to the same playlist a multiple time)
        foreach ($playlistRegions as $plRegion) {
            $playlist = $plRegion->getPlaylist();
            if ($current == null || ($playlist->getId() != $current->getId())) {
                $this->updatePLaylistOrders($playlist);
            }
            $current = $playlist;
        }
    }

    private function updatePLaylistOrders(Playlist $pl)
    {
        $playlistRegions = $this->playlistManager->getPlaylistRegionsInOrder($pl);
        $index = 1;
        foreach ($playlistRegions as $plR) {
            $plR->setOrdering($index);
            $this->save($plR);
            ++$index;
        }
    }
}
