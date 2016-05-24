<?php

namespace Innova\MediaResourceBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * Options for a Media Resource.
 *
 * @ORM\Table(name="media_resource_options")
 * @ORM\Entity
 */
class Options
{
    /**
     * @var int
     *
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    protected $id;

    /**
     * @var bool
     * @ORM\Column(type="boolean", options={"default":true})
     */
    protected $showActiveView;

    /**
     * @var bool
     * @ORM\Column(type="boolean", options={"default":false})
     */
    protected $showAutoPauseView;

    /**
     * @var bool
     * @ORM\Column(type="boolean", options={"default":false})
     */
    protected $showLiveView;

    /**
     * @var bool
     * @ORM\Column(type="boolean", options={"default":false})
     */
    protected $showExerciseView;

    /**
     * @var bool
     * @ORM\Column(type="boolean", options={"default":false})
     */
    protected $showRegionNote;

    /**
     * The language to use for tts in the form language-region ([ISO 639-1 alpha-2][-][ISO 3166-1 alpha-2]).
     * Examples: 'en', 'en-US', 'en-GB', 'zh-CN'.
     *
     * @var string
     * @ORM\Column(type="string", length=5)
     */
    protected $ttsLanguage;

    public function __construct()
    {
        $this->setShowActiveView(true);
        $this->setShowAutoPauseView(true);
        $this->setShowLiveView(true);
        $this->setShowRegionNote(false);
        $this->setShowExerciseView(false);
        $this->setTtsLanguage('en-US');
    }

    public function setId($id)
    {
        $this->id = $id;

        return $this;
    }

    public function getId()
    {
        return $this->id;
    }

    public function setShowActiveView($showActiveView)
    {
        $this->showActiveView = $showActiveView;

        return $this;
    }

    public function getShowActiveView()
    {
        return $this->showActiveView;
    }

    public function setShowAutoPauseView($showAutoPauseView)
    {
        $this->showAutoPauseView = $showAutoPauseView;

        return $this;
    }

    public function getShowAutoPauseView()
    {
        return $this->showAutoPauseView;
    }

    public function setShowLiveView($showLiveView)
    {
        $this->showLiveView = $showLiveView;

        return $this;
    }

    public function getShowLiveView()
    {
        return $this->showLiveView;
    }

    public function setShowExerciseView($showExerciseView)
    {
        $this->showExerciseView = $showExerciseView;

        return $this;
    }

    public function getShowExerciseView()
    {
        return $this->showExerciseView;
    }

    public function setShowRegionNote($showRegionNote)
    {
        $this->showRegionNote = $showRegionNote;

        return $this;
    }

    public function getShowRegionNote()
    {
        return $this->showRegionNote;
    }

    public function setTtsLanguage($ttsLanguage)
    {
        $this->ttsLanguage = $ttsLanguage;

        return $this;
    }

    public function getTtsLanguage()
    {
        return $this->ttsLanguage;
    }
}
