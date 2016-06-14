<?php

/*
 * This file is part of the Claroline Connect package.
 *
 * (c) Claroline Consortium <consortium@claroline.net>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Claroline\CursusBundle\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\ORM\Mapping as ORM;
use JMS\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * @ORM\Entity(repositoryClass="Claroline\CursusBundle\Repository\SessionEventRepository")
 * @ORM\Table(name="claro_cursusbundle_session_event")
 */
class SessionEvent
{
    /**
     * @ORM\Column(type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     * @Groups({"api_cursus"})
     */
    protected $id;

    /**
     * @ORM\Column(name="event_name")
     * @Assert\NotBlank()
     * @Groups({"api_cursus"})
     */
    protected $name;

    /**
     * @ORM\ManyToOne(
     *     targetEntity="Claroline\CursusBundle\Entity\CourseSession",
     *     inversedBy="events"
     * )
     * @ORM\JoinColumn(name="session_id", nullable=false, onDelete="CASCADE")
     */
    protected $session;

    /**
     * @ORM\Column(name="start_date", type="datetime", nullable=true)
     * @Groups({"api_cursus"})
     */
    protected $startDate;

    /**
     * @ORM\Column(name="end_date", type="datetime", nullable=true)
     * @Groups({"api_cursus"})
     */
    protected $endDate;

    /**
     * @ORM\Column(type="text", nullable=true)
     * @Groups({"api_cursus"})
     */
    protected $description;

    /**
     * @ORM\Column(type="text", nullable=true)
     * @Groups({"api_cursus"})
     */
    protected $location;

    /**
     * @ORM\OneToMany(
     *     targetEntity="Claroline\CursusBundle\Entity\SessionEventComment",
     *     mappedBy="sessionEvent"
     * )
     */
    protected $comments;

    public function __construct()
    {
        $this->comments = new ArrayCollection();
    }

    public function getId()
    {
        return $this->id;
    }

    public function setId($id)
    {
        $this->id = $id;
    }

    public function getName()
    {
        return $this->name;
    }

    public function setName($name)
    {
        $this->name = $name;
    }

    public function getSession()
    {
        return $this->session;
    }

    public function setSession(CourseSession $session)
    {
        $this->session = $session;
    }

    public function getStartDate()
    {
        return $this->startDate;
    }

    public function setStartDate($startDate)
    {
        $this->startDate = $startDate;
    }

    public function getEndDate()
    {
        return $this->endDate;
    }

    public function setEndDate($endDate)
    {
        $this->endDate = $endDate;
    }

    public function getDescription()
    {
        return $this->description;
    }

    public function setDescription($description)
    {
        $this->description = $description;
    }

    public function getLocation()
    {
        return $this->location;
    }

    public function setLocation($location)
    {
        $this->location = $location;
    }

    public function getComments()
    {
        return $this->comments->toArray();
    }
}
