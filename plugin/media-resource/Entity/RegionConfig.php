<?php

namespace Innova\MediaResourceBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;

/**
 * RegionConfig.
 *
 * @ORM\Table(name="media_resource_region_config")
 * @ORM\Entity
 */
class RegionConfig
{
    /**
     * @var int
     *
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

    /**
     * @var hasLoop
     *
     * @ORM\Column(name="has_loop", type="boolean")
     */
    private $hasLoop;

    /**
     * @var hasBackward
     *
     * @ORM\Column(name="has_backward", type="boolean")
     */
    private $hasBackward;

    /**
     * @var hasRate
     *
     * @ORM\Column(name="has_rate", type="boolean")
     */
    private $hasRate;

    /**
     * @var region
     * @ORM\OneToOne(targetEntity="Innova\MediaResourceBundle\Entity\Region", inversedBy="regionConfig")
     * @ORM\JoinColumn(nullable=false)
     */
    private $region;

    /**
     * @ORM\OneToMany(targetEntity="Innova\MediaResourceBundle\Entity\HelpText", cascade={"remove", "persist"}, mappedBy="regionConfig")
     */
    private $helpTexts;

    /**
     * @ORM\OneToMany(targetEntity="Innova\MediaResourceBundle\Entity\HelpLink", cascade={"remove", "persist"}, mappedBy="regionConfig")
     */
    private $helpLinks;

    /**
     * @var related region for help
     *              User can be helped by another region content
     * @ORM\Column(name="help_region_uuid", type="string", length=255)
     */
    private $helpRegionUuid;

    public function __construct()
    {
        $this->helpTexts = new ArrayCollection();
        $this->helpLinks = new ArrayCollection();
    }

    public function getId()
    {
        return $this->id;
    }

    public function setHasLoop($hasLoop)
    {
        $this->hasLoop = $hasLoop;

        return $this;
    }

    public function getHasLoop()
    {
        return $this->hasLoop;
    }

    public function setHasBackward($hasBackward)
    {
        $this->hasBackward = $hasBackward;

        return $this;
    }

    public function getHasBackward()
    {
        return $this->hasBackward;
    }

    public function setHasRate($hasRate)
    {
        $this->hasRate = $hasRate;

        return $this;
    }

    public function getHasRate()
    {
        return $this->hasRate;
    }

    public function addHelpText(HelpText $helpText)
    {
        $this->helpTexts[] = $helpText;

        return $this;
    }

    public function removeHelpText(HelpText $helpText)
    {
        $this->helpTexts->removeElement($helpText);

        return $this;
    }

    public function getHelpTexts()
    {
        return $this->helpTexts;
    }

    public function addHelpLink(HelpLink $helpLink)
    {
        $this->helpLinks[] = $helpLink;

        return $this;
    }

    public function removeHelpLink(HelpLink $helpLink)
    {
        $this->helpLinks->removeElement($helpLink);

        return $this;
    }

    public function getHelpLinks()
    {
        return $this->helpLinks;
    }

    public function setRegion(Region $region)
    {
        $this->region = $region;

        return $this;
    }

    public function getRegion()
    {
        return $this->region;
    }

    public function setHelpRegion(Region $helpRegion)
    {
        $this->helpRegion = $helpRegion;

        return $this;
    }

    public function getHelpRegion()
    {
        return $this->helpRegion;
    }

    public function getHelpRegionUuid()
    {
        return $this->helpRegionUuid;
    }

    public function setHelpRegionUuid($helpRegionUuid)
    {
        $this->helpRegionUuid = $helpRegionUuid;

        return $this;
    }
}
