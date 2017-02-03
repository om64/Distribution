<?php

/**
 * To import a question with holes in QTI.
 */

namespace UJM\ExoBundle\Services\classes\QTI;

use UJM\ExoBundle\Entity\Hole;
use UJM\ExoBundle\Entity\InteractionHole;
use UJM\ExoBundle\Entity\WordResponse;

class HoleImport extends QtiImport
{
    protected $interactionHole;
    protected $qtiTextWithHoles;
    protected $textHtml;
    protected $tabWrOpt = [];

    /**
     * Implements the abstract method.
     *
     * @param qtiRepository $qtiRepos
     * @param DOMElement    $assessmentItem assessmentItem of the question to imported
     * @param string        $path           parent directory of the files
     *
     * @return UJM\ExoBundle\Entity\InteractionHole
     */
    public function import(qtiRepository $qtiRepos, $assessmentItem, $path)
    {
        $this->qtiRepos = $qtiRepos;
        $this->path = $path;
        $this->getQTICategory();
        $this->initAssessmentItem($assessmentItem);

        if ($this->qtiValidate() === false) {
            return false;
        }

        $this->createQuestion(InteractionHole::TYPE);
        $this->createInteractionHole();

        $this->om->forceFlush();

        $this->addOptionValue();

        return $this->interactionHole;
    }

    /**
     * Create the InteractionHole object.
     */
    protected function createInteractionHole()
    {
        $this->interactionHole = new InteractionHole();
        $this->interactionHole->setQuestion($this->question);

        $this->getQtiTextWithHoles();
        $this->getHtml();
        $this->getHtmlWithoutValue();

        $this->om->persist($this->interactionHole);
    }

    /**
     * Get property html.
     */
    protected function getHtml()
    {
        $this->textHtml = $this->qtiTextWithHoles;
        $newId = 1;
        $regex = '(<textEntryInteraction.*?>|<inlineChoiceInteraction.*?</inlineChoiceInteraction>)';
        preg_match_all($regex, $this->qtiTextWithHoles, $matches);
        foreach ($matches[0] as $matche) {
            $tabMatche = explode('"', $matche);
            $responseIdentifier = $tabMatche[1];
            $correctResponse = $this->getCorrectResponse($responseIdentifier);
            if (substr($matche, 1, 20) == 'textEntryInteraction') {
                $expectedLength = $tabMatche[3];
                $text = str_replace('textEntryInteraction', 'input', $matche);
                /*For old questions with holes */
                $text = preg_replace('(name=".*?")', '', $text);
                if (isset($tabMatche[5])) {
                    $text = str_replace('size="'.$tabMatche[5].'"', 'size="'.$tabMatche[5].'" type="text" value="'.$correctResponse.'"', $text);
                }
                /******************************/
                $text = str_replace('responseIdentifier="'.$responseIdentifier.'"', 'id="'.$newId.'" class="blank" autocomplete="off" name="blank_'.$newId.'"', $text);
                $text = str_replace('expectedLength="'.$expectedLength.'"', 'size="'.$expectedLength.'" type="text" value="'.$correctResponse.'"', $text);
                $this->createHole($expectedLength, $responseIdentifier, false, $newId);
            } else {
                $text = str_replace('inlineChoiceInteraction', 'select', $matche);
                $text = str_replace('responseIdentifier="'.$responseIdentifier.'"', 'id="'.$newId.'" class="blank" name="blank_'.$newId.'"', $text);
                $text = str_replace('inlineChoice', 'option', $text);
                $regexOpt = '(<option identifier=.*?>)';
                preg_match_all($regexOpt, $text, $matchesOpt);
                foreach ($matchesOpt[0] as $matcheOpt) {
                    $tabMatcheOpt = explode('"', $matcheOpt);
                    $holeID = $tabMatcheOpt[1];
                    if ($correctResponse == $holeID) {
                        $opt = preg_replace('(\s*identifier="'.$holeID.'")', ' holeCorrectResponse="1"', $matcheOpt);
                    } else {
                        $opt = preg_replace('(\s*identifier="'.$holeID.'")', ' holeCorrectResponse="0"', $matcheOpt);
                    }
                    $text = str_replace($matcheOpt, $opt, $text);
                }
                $this->createHole(15, $responseIdentifier, true, $newId);
            }
            ++$newId;
            $this->textHtml = str_replace($matche, $text, $this->textHtml);
            $textHtmlClean = preg_replace('(<option holeCorrectResponse="0".*?</option>)', '', $this->textHtml);
            $textHtmlClean = str_replace(' holeCorrectResponse="1"', '', $textHtmlClean);
        }
        $this->interactionHole->setHtml($textHtmlClean);
    }

    /**
     * Get correctResponse.
     *
     *
     * @param string $identifier identifier of hole
     */
    protected function getCorrectResponse($identifier)
    {
        $correctResponse = '';
        foreach ($this->assessmentItem->getElementsByTagName('responseDeclaration') as $rp) {
            if ($rp->getAttribute('identifier') == $identifier) {
                $correctResponse = $rp->getElementsByTagName('correctResponse')
                                      ->item(0)->getElementsByTagName('value')
                                      ->item(0)->nodeValue;
            }
        }

        return $correctResponse;
    }

    /**
     * Get property htmlWithoutValue.
     */
    protected function getHtmlWithoutValue()
    {
        $htmlWithoutValue = $this->textHtml;
        $regex = '(<input.*?class="blank".*?>)';
        preg_match_all($regex, $htmlWithoutValue, $matches);
        foreach ($matches[0] as $matche) {
            if (substr($matche, 1, 5) == 'input') {
                $tabMatche = explode('"', $matche);
                $value = $tabMatche[13];
                $inputWithoutValue = str_replace('value="'.$value.'"', 'value=""', $matche);
                $htmlWithoutValue = str_replace($matche, $inputWithoutValue, $htmlWithoutValue);
            }
        }
        $this->interactionHole->sethtmlWithoutValue($htmlWithoutValue);
    }

    /**
     * addOptionValue : to add the id of wordreponse object as a value for the option element.
     */
    protected function addOptionValue()
    {
        $numOpt = 0;
        $htmlWithoutValue = $this->interactionHole->getHtmlWithoutValue();
        $regex = '(<select.*?class="blank".*?</select>)';
        preg_match_all($regex, $htmlWithoutValue, $selects);
        foreach ($selects[0] as $select) {
            $newSelect = $select;
            $regexOpt = '(<option.*?</option>)';
            preg_match_all($regexOpt, $select, $options);
            foreach ($options[0] as $option) {
                $domOpt = new \DOMDocument();
                $domOpt->loadXML($option);
                $opt = $domOpt->getElementsByTagName('option')->item(0);
                $opt->removeAttribute('holeCorrectResponse');
                $wr = $this->tabWrOpt[$numOpt];
                $optVal = $domOpt->createAttribute('value');
                $optVal->value = $wr->getId();
                $opt->appendChild($optVal);
                $newSelect = str_replace($option, $domOpt->saveHTML(), $newSelect);
                ++$numOpt;
            }
            $htmlWithoutValue = str_replace($select, $newSelect,  $htmlWithoutValue);
        }
        $this->interactionHole->setHtmlWithoutValue($htmlWithoutValue);
        $this->om->persist($this->interactionHole);
        $this->om->forceFlush();
    }

    /**
     * Create hole.
     *
     *
     * @param Intger $size     hole's size for the input
     * @param string $qtiId    id of hole in the qti file
     * @param bool   $selector text or list
     * @param int    $position position of hole in the text
     */
    protected function createHole($size, $qtiId, $selector, $position)
    {
        $hole = new Hole();
        $hole->setSize($size);
        $hole->setSelector($selector);
        $hole->setPosition($position);
        $hole->setInteractionHole($this->interactionHole);

        $this->om->persist($hole);
        $this->createWordResponse($qtiId, $hole);
    }

    /**
     * Create wordResponse.
     *
     *
     * @param string                    $qtiId id of hole in the qti file
     * @param UJM\ExoBundle\Entity\Hole $hole
     */
    protected function createWordResponse($qtiId, $hole)
    {
        foreach ($this->assessmentItem->getElementsByTagName('responseDeclaration') as $rp) {
            if ($rp->getAttribute('identifier') == $qtiId) {
                $mapping = $rp->getElementsByTagName('mapping')->item(0);
                if ($hole->getSelector() === false) {
                    $this->wordResponseForSimpleHole($mapping, $hole);
                } else {
                    $ib = $this->assessmentItem->getElementsByTagName('itemBody')->item(0);
                    $this->wordResponseForList($qtiId, $ib, $mapping, $hole);
                }
            }
        }
    }

    /**
     * Create wordResponseForSimpleHole.
     *
     *
     * @param DOMNodelist::item         $mapping element mapping
     * @param UJM\ExoBundle\Entity\Hole $hole
     */
    protected function wordResponseForSimpleHole($mapping, $hole)
    {
        foreach ($mapping->getElementsByTagName('mapEntry') as $mapEntry) {
            $keyWord = new WordResponse();
            $this->addFeedbackInLine($mapEntry, $keyWord);
            $keyWord->setResponse($mapEntry->getAttribute('mapKey'));
            $keyWord->setScore($mapEntry->getAttribute('mappedValue'));
            $keyWord->setHole($hole);
            if ($mapEntry->getAttribute('caseSensitive') == true) {
                $keyWord->setCaseSensitive(true);
            } else {
                $keyWord->setCaseSensitive(false);
            }
            $this->om->persist($keyWord);
        }
    }

    /**
     * Create wordResponseForList.
     *
     *
     * @param string                    $qtiId   id of hole in the qti file
     * @param DOMNodelist::item         $ib      element itemBody
     * @param DOMNodelist::item         $mapping element mapping
     * @param UJM\ExoBundle\Entity\Hole $hole
     */
    protected function wordResponseForList($qtiId, $ib, $mapping, $hole)
    {
        foreach ($ib->getElementsByTagName('inlineChoiceInteraction') as $ici) {
            if ($ici->getAttribute('responseIdentifier') == $qtiId) {
                foreach ($ici->getElementsByTagName('inlineChoice') as $ic) {
                    $keyWord = new WordResponse();
                    $score = 0;
                    $matchScore = false;
                    $keyWord->setResponse($ic->nodeValue);
                    foreach ($mapping->getElementsByTagName('mapEntry') as $mapEntry) {
                        if ($mapEntry->getAttribute('mapKey') == $ic->getAttribute('identifier')) {
                            $score = $mapEntry->getAttribute('mappedValue');
                            $matchScore = true;
                            $this->addFeedbackInLine($mapEntry, $keyWord);
                        }
                        if ($mapEntry->getAttribute('caseSensitive') == true) {
                            $keyWord->setCaseSensitive(true);
                        } else {
                            $keyWord->setCaseSensitive(false);
                        }
                    }
                    if ($matchScore === false) {
                        foreach ($mapping->getElementsByTagName('mapEntry') as $mapEntry) {
                            if ($mapEntry->getAttribute('mapKey') == $ic->nodeValue) {
                                $score = $mapEntry->getAttribute('mappedValue');
                            }
                        }
                    }
                    $keyWord->setScore($score);
                    $keyWord->setHole($hole);
                    $this->om->persist($keyWord);

                    $this->tabWrOpt[] = $keyWord;
                }
            }
        }
    }
    protected function addFeedbackInLine($mapEntry, $keyWord)
    {
        $feedback = $mapEntry->getElementsByTagName('feedbackInline');
        if ($feedback->item(0)) {
            $feedbackVal = $this->domElementToString($feedback->item(0));
            $feedbackVal = html_entity_decode($feedbackVal);
            $keyWord->setFeedback($feedbackVal);
            $mapEntry->removeChild($feedback->item(0));
        }
    }

    /**
     * Get qtiTextWithHoles.
     */
    protected function getQtiTextWithHoles()
    {
        $ib = $this->assessmentItem->getElementsByTagName('itemBody')->item(0);
        $text = $this->domElementToString($ib);
        $text = str_replace('<itemBody>', '', $text);
        $text = str_replace('</itemBody>', '', $text);
        $this->qtiTextWithHoles = html_entity_decode($text);
    }

    /**
     * Implements the abstract method.
     */
    protected function getPrompt()
    {
        $text = '';
        $ib = $this->assessmentItem->getElementsByTagName('itemBody')->item(0);
        if ($ib->getElementsByTagName('prompt')->item(0)) {
            $prompt = $ib->getElementsByTagName('prompt')->item(0);
            $text = $this->domElementToString($prompt);
            $text = str_replace('<prompt>', '', $text);
            $text = str_replace('</prompt>', '', $text);
            $text = html_entity_decode($text);
            $ib->removeChild($ib->getElementsByTagName('prompt')->item(0));
        }

        return $text;
    }

    /**
     * Implements the abstract method.
     */
    public function qtiValidate()
    {
        if ($this->assessmentItem->getElementsByTagName('responseDeclaration')->item(0) == null) {
            return false;
        }

        $rps = $this->assessmentItem->getElementsByTagName('responseDeclaration');
        foreach ($rps as $rp) {
            if ($rp->getElementsByTagName('mapping')->item(0) == null) {
                return false;
            }
        }

        return true;
    }
}
