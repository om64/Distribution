<?php

/**
 * To import an open question whith one word.
 */

namespace UJM\ExoBundle\Services\classes\QTI;

use UJM\ExoBundle\Entity\WordResponse;

class OpenShortImport extends OpenImport
{
    /**
     * overload the export method.
     *
     * @param qtiRepository $qtiRepos
     * @param DOMElement    $assessmentItem assessmentItem of the question to imported
     * @param string        $path           parent directory of the files
     *
     * @return UJM\ExoBundle\Entity\InteractionOpen
     */
    public function import(qtiRepository $qtiRepos, $assessmentItem, $path)
    {
        $this->codeType = 3;
        parent::import($qtiRepos, $assessmentItem, $path);
        $this->createWordResponse();

        return $this->interactionOpen;
    }

    /**
     *
     */
    protected function getPromptChild()
    {
        $text = '';
        $ib = $this->assessmentItem->getElementsByTagName('itemBody')->item(0);
        if ($ib->getElementsByTagName('prompt')->item(0)) {
            $prompt = $ib->getElementsByTagName('prompt')->item(0);
            $text = $this->domElementToString($prompt);
            $text = str_replace('<prompt>', '', $text);
            $text = str_replace('</prompt>', '', $text);
            $text = html_entity_decode($text);
        }

        return $text;
    }

    /**
     * Create wordResponse.
     */
    private function createWordResponse()
    {
        $rp = $this->assessmentItem->getElementsByTagName('responseDeclaration')->item(0);
        $mapping = $rp->getElementsByTagName('mapping')->item(0);
        foreach ($mapping->getElementsByTagName('mapEntry') as $me) {
            $keyWord = new WordResponse();
            $feedback = $me->getElementsByTagName('feedbackInline');
            if ($feedback->item(0)) {
                $feedbackVal = $this->domElementToString($feedback->item(0));
                $feedbackVal = html_entity_decode($feedbackVal);
                $keyWord->setFeedback($feedbackVal);
                $me->removeChild($feedback->item(0));
            }
            $keyWord->setResponse($me->getAttribute('mapKey'));
            $keyWord->setScore($me->getAttribute('mappedValue'));
            $keyWord->setInteractionOpen($this->interactionOpen);
            if ($me->getAttribute('caseSensitive') == true) {
                $keyWord->setCaseSensitive(true);
            } else {
                $keyWord->setCaseSensitive(false);
            }
            $this->om->persist($keyWord);
        }
        $this->om->flush();
    }
}
