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
     * View mode for the ressource.
     *
     * @var string
     * @ORM\Column(type="string", length=255)
     */
    protected $mode;

    /**
     * @var bool
     * @ORM\Column(type="boolean", options={"default":false})
     */
    protected $showTextTranscription;

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
        $this->setMode('live');
        $this->setShowTextTranscription(false);
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

    public function setMode($mode)
    {
        $this->mode = $mode;

        return $this;
    }

    public function getMode()
    {
        return $this->mode;
    }

    public function setShowTextTranscription($showTextTranscription)
    {
        $this->showTextTranscription = $showTextTranscription;

        return $this;
    }

    public function getShowTextTranscription()
    {
        return $this->showTextTranscription;
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
