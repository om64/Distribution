<?php

namespace UJM\ExoBundle\Services\classes\QTI;

use UJM\ExoBundle\Entity\Hole;
use UJM\ExoBundle\Entity\InteractionHole;
use UJM\ExoBundle\Entity\WordResponse;

/**
 * To import a question with holes in QTI.
 */
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
        $this->textHtml = '<my-wrapper>'.$this->qtiTextWithHoles.'</my-wrapper>';
        $newId = 1;
        $dom = new \DOMDocument();
        $dom->loadXML($this->textHtml);
        $xpath = new \DOMXPath($dom);
        $interactions = $xpath->query('//textEntryInteraction | //inlineChoiceInteraction');

        foreach ($interactions as $interaction) {
            $responseIdentifier = $interaction->attributes->getNamedItem('responseIdentifier')->nodeValue;
            $correctResponse = $this->getCorrectResponse($responseIdentifier);
            $originalText = $dom->saveXML($interaction);
            $text = $dom->saveXML($interaction);

            if ($interaction->tagName === 'textEntryInteraction') {
                $expectedLength = $interaction->attributes->getNamedItem('expectedLength')->nodeValue;
                $text = str_replace('textEntryInteraction', 'input ', $text);
                $text = str_replace(
                    'responseIdentifier="'.$responseIdentifier.'"',
                    'id="'.$newId.'" class="blank" autocomplete="off" name="blank_'.$newId.'"',
                    $text
                );
                $text = str_replace(
                    'expectedLength="'.$expectedLength.'"',
                    'size="'.$expectedLength.'" type="text" value="'.$correctResponse.'"',
                    $text
                );
                $this->createHole($expectedLength, $responseIdentifier, false, $newId);
                $this->textHtml = str_replace($originalText, $text, $this->textHtml);
                ++$newId;
            } elseif ($interaction->tagName === 'inlineChoiceInteraction') {
                $text = str_replace(
                    'responseIdentifier="'.$responseIdentifier.'"',
                    'id="'.$newId.'" class="blank" name="blank_'.$newId.'"',
                    $text
                );
                $text = str_replace('inlineChoiceInteraction', 'select', $text);

                $choices = $interaction->childNodes;

                foreach ($choices as $choice) {
                    $originalChoiceText = $dom->saveXML($choice);
                    $choiceText = $dom->saveXML($choice);
                    $holeId = $choice->attributes->getNamedItem('identifier')->nodeValue;

                    if ($correctResponse === $holeId) {
                        $choiceText = preg_replace('(\s*identifier="'.$holeId.'")', ' holeCorrectResponse="1"', $choiceText);
                    } else {
                        $choiceText = preg_replace('(\s*identifier="'.$holeId.'")', ' holeCorrectResponse="0"', $choiceText);
                    }
                    $text = str_replace($originalChoiceText, $choiceText, $text);
                }
                $text = str_replace('inlineChoice', 'option', $text);
                $this->createHole(15, $responseIdentifier, true, $newId);
                $this->textHtml = str_replace($originalText, $text, $this->textHtml);
                ++$newId;
            }
        }
        $textHtmlClean = preg_replace('(<option holeCorrectResponse="0".*?</option>)', '', $this->textHtml);
        $textHtmlClean = str_replace(' holeCorrectResponse="1"', '', $textHtmlClean);
        $textHtmlClean = str_replace('<my-wrapper>', '', $textHtmlClean);
        $textHtmlClean = str_replace('</my-wrapper>', '', $textHtmlClean);
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
            if ($rp->getAttribute('identifier') === $identifier) {
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
            if (substr($matche, 1, 5) === 'input') {
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
     * @param int    $size     hole's size for the input
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
            if ($rp->getAttribute('identifier') === (string) $qtiId) {
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
            if ((bool) $mapEntry->getAttribute('caseSensitive') === true) {
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
            if ($ici->getAttribute('responseIdentifier') === (string) $qtiId) {
                foreach ($ici->getElementsByTagName('inlineChoice') as $ic) {
                    $keyWord = new WordResponse();
                    $score = 0;
                    $matchScore = false;
                    $keyWord->setResponse($ic->nodeValue);
                    foreach ($mapping->getElementsByTagName('mapEntry') as $mapEntry) {
                        if ($mapEntry->getAttribute('mapKey') === $ic->getAttribute('identifier')) {
                            $score = $mapEntry->getAttribute('mappedValue');
                            $matchScore = true;
                            $this->addFeedbackInLine($mapEntry, $keyWord);
                        }
                        if ((bool) $mapEntry->getAttribute('caseSensitive') === true) {
                            $keyWord->setCaseSensitive(true);
                        } else {
                            $keyWord->setCaseSensitive(false);
                        }
                    }
                    if ($matchScore === false) {
                        foreach ($mapping->getElementsByTagName('mapEntry') as $mapEntry) {
                            if ($mapEntry->getAttribute('mapKey') === $ic->nodeValue) {
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
        if (empty($this->assessmentItem->getElementsByTagName('responseDeclaration')->item(0))) {
            return false;
        }

        $rps = $this->assessmentItem->getElementsByTagName('responseDeclaration');
        foreach ($rps as $rp) {
            if (empty($rp->getElementsByTagName('mapping')->item(0))) {
                return false;
            }
        }

        return true;
    }
}
