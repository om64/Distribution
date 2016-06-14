<?php
/**
 * Created by : Eric VINCENT
 * Date: 04/2016.
 */

namespace Innova\CollecticielBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity()
 * @ORM\Table(name="innova_collecticielbundle_choice_criteria")
 */
class ChoiceCriteria
{
    /**
     * @ORM\Id
     * @ORM\Column(type="integer")
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    protected $id;

    /**
     * Lien avec la table GradingCriteria.
     */
    /**
     * @ORM\ManyToOne(
     *      targetEntity="Innova\CollecticielBundle\Entity\GradingCriteria",
     *      inversedBy="choiceCriterias"
     * )
     * @ORM\JoinColumn(name="criteria_id", referencedColumnName="id", nullable=false, onDelete="CASCADE")
     */
    protected $gradingCriteria;

    /**
     * @ORM\Column(name="choice_text",type="text", nullable=true)
     */
    protected $choiceText = null;

    /**
     * Get id.
     *
     * @return int
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * Set choiceText.
     *
     * @param string $choiceText
     *
     * @return ChoiceCriteria
     */
    public function setChoiceText($choiceText)
    {
        $this->choiceText = $choiceText;

        return $this;
    }

    /**
     * Get choiceText.
     *
     * @return string
     */
    public function getChoiceText()
    {
        return $this->choiceText;
    }

    /**
     * Set gradingCriteria.
     *
     * @param \Innova\CollecticielBundle\Entity\GradingCriteria $gradingCriteria
     *
     * @return ChoiceCriteria
     */
    public function setGradingCriteria(\Innova\CollecticielBundle\Entity\GradingCriteria $gradingCriteria)
    {
        $this->gradingCriteria = $gradingCriteria;

        return $this;
    }

    /**
     * Get gradingCriteria.
     *
     * @return \Innova\CollecticielBundle\Entity\GradingCriteria
     */
    public function getGradingCriteria()
    {
        return $this->gradingCriteria;
    }
}
