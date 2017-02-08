<?php

namespace UJM\ExoBundle\Transfer\Json\QuestionHandler;

use Claroline\CoreBundle\Persistence\ObjectManager;
use JMS\DiExtraBundle\Annotation as DI;
use Symfony\Component\DependencyInjection\ContainerInterface;
use UJM\ExoBundle\Entity\Hole;
use UJM\ExoBundle\Entity\InteractionHole;
use UJM\ExoBundle\Entity\Question;
use UJM\ExoBundle\Entity\Response;
use UJM\ExoBundle\Entity\WordResponse;
use UJM\ExoBundle\Transfer\Json\QuestionHandlerInterface;

/**
 * @DI\Service("ujm.exo.hole_handler")
 * @DI\Tag("ujm.exo.question_handler")
 */
class HoleHandler implements QuestionHandlerInterface
{
    private $om;
    private $container;

    /**
     * @DI\InjectParams({
     *     "om"              = @DI\Inject("claroline.persistence.object_manager"),
     *     "container"       = @DI\Inject("service_container")
     * })
     *
     * @param ObjectManager      $om
     * @param ContainerInterface $container
     */
    public function __construct(ObjectManager $om, ContainerInterface $container)
    {
        $this->om = $om;
        $this->container = $container;
    }

    /**
     * {@inheritdoc}
     */
    public function getQuestionMimeType()
    {
        return 'application/x.cloze+json';
    }

    /**
     * {@inheritdoc}
     */
    public function getInteractionType()
    {
        return InteractionHole::TYPE;
    }

    /**
     * {@inheritdoc}
     */
    public function getJsonSchemaUri()
    {
        return 'http://json-quiz.github.io/json-quiz/schemas/question/cloze/schema.json';
    }

    /**
     * {@inheritdoc}
     */
    public function validateAfterSchema(\stdClass $questionData)
    {
        $errors = [];

        if (!isset($questionData->solutions)) {
            return $errors;
        }

        // check solution ids are consistent with choice ids
        $holeIds = array_map(function ($hole) {
            return $hole->id;
        }, $questionData->holes);

        foreach ($questionData->solutions as $index => $solution) {
            if (empty($solution->holeId)) {
                $errors[] = [
                    'path' => "solutions[{$index}]",
                    'message' => 'a holeId property is required',
                ];
            }

            if (empty($solution->answers)) {
                $errors[] = [
                    'path' => "solutions[{$index}]",
                    'message' => 'a answers property is required',
                ];
            }

            if (!in_array($solution->holeId, $holeIds)) {
                $errors[] = [
                    'path' => "solutions[{$index}]",
                    'message' => "id {$solution->holeId} doesn't match any hole id",
                ];
            }
        }

        // check there is a positive score solution
        $maxScore = -1;
        foreach ($questionData->solutions as $solution) {
            foreach ($solution->answers as $answer) {
                if ($answer->score > $maxScore) {
                    $maxScore = $answer->score;
                }
            }
        }

        if ($maxScore <= 0) {
            $errors[] = [
                'path' => 'solutions',
                'message' => 'there is no solution with a positive score',
            ];
        }

        return $errors;
    }

    /**
     * {@inheritdoc}
     */
    public function persistInteractionDetails(Question $question, \stdClass $importData)
    {
        $interaction = new InteractionHole();

        for ($i = 0, $max = count($importData->holes); $i < $max; ++$i) {
            // temporary limitation
            if ($importData->holes[$i]->type !== 'text/html') {
                throw new \Exception(
                    "Import not implemented for MIME type {$importData->holes[$i]->type}"
                );
            }

            $hole = new Hole();
            $hole->setOrdre($i);

            $hole->setInteractionHole($interaction);
            $interaction->addHole($hole);
            $this->om->persist($hole);
        }

        $interaction->setQuestion($question);
        $this->om->persist($interaction);
    }

    /**
     * {@inheritdoc}
     */
    public function convertInteractionDetails(Question $question, \stdClass $exportData, $withSolution = true, $forPaperList = false)
    {
        $repo = $this->om->getRepository('UJMExoBundle:InteractionHole');
        $holeQuestion = $repo->findOneBy(['question' => $question]);
        $holes = $holeQuestion->getHoles()->toArray();
        $text = $holeQuestion->getHtmlWithoutValue();

        $exportData->text = $text;
        if ($withSolution) {
            $exportData->solution = $holeQuestion->getHtml();
            $exportData->solutions = array_map(function ($hole) {
                $solutionData = new \stdClass();
                $solutionData->holeId = (string) $hole->getId();
                $wordResponses = $hole->getWordResponses()->toArray();
                $expectedWord = null;
                array_walk($wordResponses, function ($wr) use (&$expectedWord) {
                    if (empty($expectedWord) || ($wr->getScore() > $expectedWord->getScore())) {
                        $expectedWord = $wr;
                    }
                });

                $solutionData->answers = array_map(function ($wr) use ($expectedWord) {
                    $wrData = new \stdClass();
                    $wrData->id = (string) $wr->getId();
                    $wrData->text = (string) $wr->getResponse();
                    $wrData->caseSensitive = $wr->getCaseSensitive();
                    $wrData->score = $wr->getScore();
                    $wrData->feedback = $wr->getFeedback();
                    $wrData->rightResponse = $expectedWord->getId() === $wr->getId();

                    return $wrData;
                }, $wordResponses);

                return $solutionData;
            }, $holes);
        }

        $exportData->holes = array_map(function ($hole) {
            $holeData = new \stdClass();
            $holeData->id = (string) $hole->getId();
            $holeData->type = 'text/html';
            $holeData->selector = $hole->getSelector();
            $holeData->position = (string) $hole->getPosition();

            return $holeData;
        }, $holes);

        return $exportData;
    }

    public function convertQuestionAnswers(Question $question, \stdClass $exportData)
    {
        $repo = $this->om->getRepository('UJMExoBundle:InteractionHole');
        $holeQuestion = $repo->findOneBy(['question' => $question]);

        $holes = $holeQuestion->getHoles()->toArray();
        $exportData->solutions = array_map(function ($hole) {
            $solutionData = new \stdClass();
            $solutionData->holeId = (string) $hole->getId();

            $wordResponses = $hole->getWordResponses()->toArray();
            $expectedWord = null;
            array_walk($wordResponses, function ($wr) use (&$expectedWord) {
                if (empty($expectedWord) || ($wr->getScore() > $expectedWord->getScore())) {
                    $expectedWord = $wr;
                }
            });

            $solutionData->answers = array_map(function ($wr) use ($expectedWord) {
                $wrData = new \stdClass();
                $wrData->id = (string) $wr->getId();
                $wrData->text = (string) $wr->getResponse();
                $wrData->caseSensitive = $wr->getCaseSensitive();
                $wrData->score = $wr->getScore();
                $wrData->rightResponse = $expectedWord->getId() === $wr->getId();
                if ($wr->getFeedback()) {
                    $wrData->feedback = $wr->getFeedback();
                }

                return $wrData;
            }, $hole->getWordResponses()->toArray());

            return $solutionData;
        }, $holes);

        return $exportData;
    }

    /**
     * {@inheritdoc}
     */
    public function convertAnswerDetails(Response $response)
    {
        $parts = json_decode($response->getResponse());

        $array = [];
        foreach ($parts as $key => $value) {
            $array[$key] = $value;
        }

        return array_filter($array, function ($part) {
            return $part !== '';
        });
    }

    /**
     * {@inheritdoc}
     */
    public function generateStats(Question $question, array $answers)
    {
        $holeQuestion = $this->om->getRepository('UJMExoBundle:InteractionHole')->findOneBy([
            'question' => $question,
        ]);

        // Create an array with holeId => holeObject for easy search
        $holesMap = [];
        /** @var Hole $hole */
        foreach ($holeQuestion->getHoles() as $hole) {
            $holesMap[$hole->getId()] = $hole;
        }

        $holes = [];

        /** @var Response $answer */
        foreach ($answers as $answer) {
            // Manually decode data to make it easier to process
            $decoded = $this->convertAnswerDetails($answer);

            foreach ($decoded as $holeAnswer) {
                if (!empty($holeAnswer->answerText)) {
                    if (!isset($holes[$holeAnswer->holeId])) {
                        $holes[$holeAnswer->holeId] = new \stdClass();
                        $holes[$holeAnswer->holeId]->id = $holeAnswer->holeId;
                        $holes[$holeAnswer->holeId]->answered = 0;

                        // Answers counters for each keyword of the hole
                        $holes[$holeAnswer->holeId]->keywords = [];
                    }

                    // Increment the hole answers count
                    ++$holes[$holeAnswer->holeId]->answered;

                    /** @var WordResponse $keyword */
                    foreach ($holesMap[$holeAnswer->holeId]->getWordResponses() as $keyword) {
                        // Check if the response match the current keyword
                        if ($holesMap[$holeAnswer->holeId]->getSelector()) {
                            // It's the ID of the keyword which is stored
                            $found = $keyword->getId() === (int) $holeAnswer->answerText;
                        } else {
                            if ($keyword->getCaseSensitive()) {
                                $found = strtolower($keyword->getResponse()) === strtolower($holeAnswer->answerText);
                            } else {
                                $found = $keyword->getResponse() === $holeAnswer->answerText;
                            }
                        }

                        if ($found) {
                            if (!isset($holes[$holeAnswer->holeId]->keywords[$keyword->getId()])) {
                                // Initialize the Hole keyword counter if it's the first time we find it
                                $holes[$holeAnswer->holeId]->keywords[$keyword->getId()] = new \stdClass();
                                $holes[$holeAnswer->holeId]->keywords[$keyword->getId()]->id = $keyword->getId();
                                $holes[$holeAnswer->holeId]->keywords[$keyword->getId()]->count = 0;
                            }

                            ++$holes[$holeAnswer->holeId]->keywords[$keyword->getId()]->count;

                            break;
                        }
                    }
                }
            }
        }

        return $holes;
    }

    /**
     * {@inheritdoc}
     */
    public function validateAnswerFormat(Question $question, $data)
    {
        if (!is_array($data)) {
            return ['Answer data must be an array, '.gettype($data).' given'];
        }

        if (0 === count($data)) {
            return [];
        }

        $interaction = $this->om->getRepository('UJMExoBundle:InteractionHole')
            ->findOneByQuestion($question);

        $holeIds = array_map(function ($hole) {
            return (string) $hole->getId();
        }, $interaction->getHoles()->toArray());

        foreach ($data as $answer) {
            if ($answer || $answer !== null) {
                if (empty($answer['holeId'])) {
                    return ['Answer `holeId` cannot be empty'];
                }

                if (!is_string($answer['holeId'])) {
                    return ['Answer `holeId` must contain only strings , '.gettype($answer['holeId']).' given.'];
                }

                if (!in_array($answer['holeId'], $holeIds)) {
                    return ['Answer array identifiers must reference question holes'];
                }

                if (!empty($answer['answerText']) && !is_string($answer['answerText'])) {
                    return ['Answer `answerText` must contain only strings , '.gettype($answer['holeId']).' given.'];
                }
            }
        }

        return [];
    }

    /**
     * @todo handle global score option
     *
     * {@inheritdoc}
     */
    public function storeAnswerAndMark(Question $question, Response $response, $data)
    {
        $interaction = $this->om->getRepository('UJMExoBundle:InteractionHole')
            ->findOneByQuestion($question);

        $answers = [];
        foreach ($data as $answer) {
            if ($answer && $answer !== null && !empty($answer['answerText'])) {
                $answers[] = $answer;
            }
        }

        $serviceHole = $this->container->get('ujm.exo.hole_service');

        $mark = $serviceHole->mark($interaction, $data, 0);

        if ($mark < 0) {
            $mark = 0;
        }

        $json = json_encode($answers);
        $response->setResponse($json);
        $response->setMark($mark);
    }
}
