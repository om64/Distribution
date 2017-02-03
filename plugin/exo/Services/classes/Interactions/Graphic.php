<?php

namespace UJM\ExoBundle\Services\classes\Interactions;

use JMS\DiExtraBundle\Annotation as DI;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Session\SessionInterface;

/**
 * Services for the graphic.
 *
 * @DI\Service("ujm.exo.graphic_service")
 */
class Graphic extends Interaction
{
    /**
     * implement the abstract method
     * To process the user's response for a paper(or a test).
     *
     * @param \Symfony\Component\HttpFoundation\Request $request
     * @param int                                       $paperID id Paper or 0 if it's just a question test and not a paper
     *
     * @return mixed[]
     */
    public function response(Request $request, $paperID = 0)
    {
        $answers = $request->request->get('answers'); // Answer of the student
        $graphId = $request->request->get('graphId'); // Id of the graphic interaction

        $em = $this->doctrine->getManager();

        $rightCoords = $em->getRepository('UJMExoBundle:Coords')
            ->findBy(['interactionGraphic' => $graphId]);

        $interG = $em->getRepository('UJMExoBundle:InteractionGraphic')
            ->find($graphId);

        $doc = $em->getRepository('UJMExoBundle:Picture')
            ->findOneBy(['id' => $interG->getPicture()]);

        if (!preg_match('/[0-9]+/', $answers)) {
            $answers = '';
        }

        $penalty = $this->getPenalty($interG->getQuestion(), $request->getSession(), $paperID);
        $score = $this->mark($answers, $rightCoords, $penalty);
        $total = $this->maxScore($interG); // Score max

        $res = [
            'penalty' => $penalty, // Penalty (hints)
            'interG' => $interG, // The entity interaction graphic (for the id ...)
            'coords' => $rightCoords, // The coordinates of the right answer zones
            'doc' => $doc, // The answer picture (label, src ...)
            'total' => $total, // Score max if all answers right and no penalty
            'rep' => preg_split('[;]', $answers), // Coordinates of the answer zones of the student's answer
            'score' => $score, // Score of the student (right answer - penalty)
            'response' => $answers, // The student's answer (with all the information of the coordinates)
        ];

        return $res;
    }

    /**
     * Temporary method (to delete with the full angular)
     * To process the user's response for a paper(or a test).
     *
     * @param \Symfony\Component\HttpFoundation\Request $request
     * @param int                                       $paperID id Paper or 0 if it's just a question test and not a paper
     *
     * @return mixed[]
     */
    public function responsePhp(Request $request, $paperID = 0)
    {
        $answers = $request->request->get('answers'); // Answer of the student
        $graphId = $request->request->get('graphId'); // Id of the graphic interaction
        $coords = preg_split('[;]', $answers); // Divide the answer zones into cells
        $em = $this->doctrine->getManager();
        $rightCoords = $em->getRepository('UJMExoBundle:Coords')
            ->findBy(['interactionGraphic' => $graphId]);

        $interG = $em->getRepository('UJMExoBundle:InteractionGraphic')
            ->find($graphId);
        $doc = $em->getRepository('UJMExoBundle:Picture')
            ->findOneBy(['id' => $interG->getPicture()]);
        $point = $this->markPhp($answers, $request, $rightCoords, $coords);
        $session = $request->getSession();
        $penalty = $this->getPenalty($interG->getQuestion(), $session, $paperID);
        $score = $point - $penalty; // Score of the student with penalty
        // Not negatif score
        if ($score < 0) {
            $score = 0;
        }
        if (!preg_match('/[0-9]+/', $answers)) {
            $answers = '';
        }
        $total = $this->maxScore($interG); // Score max
        $res = [
            'point' => $point, // Score of the student without penalty
            'penalty' => $penalty, // Penalty (hints)
            'interG' => $interG, // The entity interaction graphic (for the id ...)
            'coords' => $rightCoords, // The coordonates of the right answer zones
            'doc' => $doc, // The answer picture (label, src ...)
            'total' => $total, // Score max if all answers right and no penalty
            'rep' => $coords, // Coordonates of the answer zones of the student's answer
            'score' => $score, // Score of the student (right answer - penalty)
            'response' => $answers, // The student's answer (with all the informations of the coordonates)
        ];

        return $res;
    }

    /**
     * implement the abstract method
     * To calculate the score.
     *
     * @param string                         $answer
     * @param \UJM\ExoBundle\Entity\Coords[] $rightCoords
     * @param number                         $penalty
     *
     * @return float
     */
    public function mark($answer = null, array $rightCoords = null, $penalty = null)
    {
        $score = 0;

        // Get the list of submitted coords from the answer string
        $coordsList = preg_split('/[;,]/', $answer);
        if (!empty($coordsList)) {
            // Loop through correct answers to know if they are in the submitted data
            foreach ($rightCoords as $expected) {
                // Get X and Y values from expected string
                list($xr, $yr) = explode(',', $expected->getValue());
                // Get tolerance zone
                $zoneSize = $expected->getSize();
                $zoneShape = $expected->getShape();

                foreach ($coordsList as $coords) {
                    if (preg_match('/[0-9]+/', $coords)) {
                        // Get X and Y values from answers of the student
                        list($xa, $ya) = explode('-', $coords);

                        if ($zoneShape === 'circle') {
                            $xcenter = $xr + ($zoneSize / 2);
                            $ycenter = $yr + ($zoneSize / 2);
                            $valid = pow($xa - $xcenter, 2) + pow($ya - $ycenter, 2) <= pow($zoneSize / 2, 2);
                        } elseif ($zoneShape === 'square') {
                            $valid = ($xa <= ($xr + $zoneSize)) && ($xa > $xr) && ($ya <= ($yr + $zoneSize)) && ($ya > $yr);
                        }

                        if ($valid) {
                            // The student answer is in the answer zone give him the points
                            $score += $expected->getScoreCoords();

                            break; // We have found an answer for this answer zone, so we directly pass to the next one
                        }
                    }
                }
            }
        }

        if ($penalty) {
            $score = $score - $penalty; // Score of the student with penalty
        }

        // Not negative score
        if ($score < 0) {
            $score = 0;
        }

        return $score;
    }

    public function isInArea(\stdClass $coords, \stdClass $area)
    {
        $in = false;

        switch ($area->shape) {
            case 'circle':
                if (pow($coords->x - $area->center->x, 2) + pow($coords->y - $area->center->y, 2) <= pow($area->radius, 2)) {
                    $in = true;
                }
                break;

            case 'rect':
                if ($coords->x >= $area->coords[0]->x && $coords->x <= $area->coords[1]->x
                    && $coords->y >= $area->coords[0]->y && $coords->y <= $area->coords[1]->y) {
                    $in = true;
                }
                break;
        }

        return $in;
    }

    /**
     * Temporary method (to delete with the full angular)
     * To calculate the score.
     *
     *
     * @param string                                             $answers
     * @param \Symfony\Component\HttpFoundation\Request          $request
     * @param doctrineCollection of \UJM\ExoBundle\Entity\Coords $rightCoords
     * @param array [string]                                     $coords
     *
     * @return float
     */
    public function markPhp($answers = null, $request = null, $rightCoords = null, $coords = null)
    {
        // differenciate the exercise of the bank of questions
        if (is_int($request)) {
            $max = $request;
            $coords = preg_split('[,]', $answers); // Divide the answer zones into cells
        } else {
            $max = $request->request->get('nbpointer'); // Number of answer zones
            $coords = preg_split('[;]', $answers); // Divide the answer zones into cells
        }

        $verif = [];
        $point = $z = 0;

        for ($i = 0; $i < $max - 1; ++$i) {
            for ($j = 0; $j < $max - 1; ++$j) {
                if (preg_match('/[0-9]+/', $coords[$j])) {
                    list($xa, $ya) = explode('-', $coords[$j]); // Answers of the student
                    list($xr, $yr) = explode(',', $rightCoords[$i]->getValue()); // Right answers
                    $valid = $rightCoords[$i]->getSize(); // Size of the answer zone
                    // If answer student is in right answer
                    if ((($xa + 8) < ($xr + $valid)) && (($xa + 8) > ($xr)) &&
                        (($ya + 8) < ($yr + $valid)) && (($ya + 8) > ($yr))
                    ) {
                        // Not get points twice for one answer
                        if ($this->alreadyDone($rightCoords[$i]->getValue(), $verif, $z)) {
                            $point += $rightCoords[$i]->getScoreCoords(); // Score of the student without penalty
                            $verif[$z] = $rightCoords[$i]->getValue(); // Add this answer zone to already answered zones
                            ++$z;
                        }
                    }
                }
            }
        }

        return $point;
    }

    /**
     * implement the abstract method
     * Get score max possible for a graphic question.
     *
     * @param \UJM\ExoBundle\Entity\InteractionGraphic $interGraph
     *
     * @return float
     */
    public function maxScore($interGraph = null)
    {
        $em = $this->doctrine->getManager();
        $scoreMax = 0;

        $rightCoords = $em->getRepository('UJMExoBundle:Coords')
            ->findBy(['interactionGraphic' => $interGraph->getId()]);

        foreach ($rightCoords as $score) {
            $scoreMax += $score->getScoreCoords();
        }

        return $scoreMax;
    }

    /**
     * implement the abstract method.
     *
     * @param int $questionId
     *
     * @return \UJM\ExoBundle\Entity\InteractionGraphic
     */
    public function getInteractionX($questionId)
    {
        return $this->doctrine->getManager()
            ->getRepository('UJMExoBundle:InteractionGraphic')
            ->findOneByQuestion($questionId);
    }

    /**
     * implement the abstract method.
     *
     * call getAlreadyResponded and prepare the interaction to displayed if necessary
     *
     * @param \UJM\ExoBundle\Entity\Interaction                            $interactionToDisplay interaction (question) to displayed
     * @param \Symfony\Component\HttpFoundation\Session\SessionInterface   $session
     * @param \UJM\ExoBundle\Entity\InteractionX (qcm, graphic, open, ...) $interactionX
     *
     * @return \UJM\ExoBundle\Entity\Response
     */
    public function getResponseGiven($interactionToDisplay, SessionInterface $session, $interactionX)
    {
        $responseGiven = $this->getAlreadyResponded($interactionToDisplay, $session);

        return $responseGiven;
    }
    /**
     * Temporary method (to delete with the full angular)
     * Graphic question : Check if the suggested answer zone isn't already right in order not to have points twice.
     *
     * @param string $coor  coords of one right answer
     * @param array  $verif list of the student's placed answers zone
     * @param int    $z     number of rights placed answers by the user
     *
     * @return bool
     */
    private function alreadyDone($coor, $verif, $z)
    {
        $resu = true;
        for ($v = 0; $v < $z; ++$v) {
            // if already placed at this right place
            if ($coor === $verif[$v]) {
                $resu = false;
                break;
            } else {
                $resu = true;
            }
        }

        return $resu;
    }
}
