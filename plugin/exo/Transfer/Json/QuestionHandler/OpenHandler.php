<?php

namespace UJM\ExoBundle\Transfer\Json\QuestionHandler;

use Claroline\CoreBundle\Persistence\ObjectManager;
use JMS\DiExtraBundle\Annotation as DI;
use Symfony\Component\DependencyInjection\ContainerInterface;
use UJM\ExoBundle\Entity\InteractionOpen;
use UJM\ExoBundle\Entity\Question;
use UJM\ExoBundle\Entity\Response;
use UJM\ExoBundle\Entity\WordResponse;
use UJM\ExoBundle\Transfer\Json\QuestionHandlerInterface;

/**
 * @DI\Service("ujm.exo.open_handler")
 * @DI\Tag("ujm.exo.question_handler")
 */
class OpenHandler implements QuestionHandlerInterface
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
        return 'application/x.short+json';
    }

    /**
     * {@inheritdoc}
     */
    public function getInteractionType()
    {
        return InteractionOpen::TYPE;
    }

    /**
     * {@inheritdoc}
     */
    public function getJsonSchemaUri()
    {
        return 'http://json-quiz.github.io/json-quiz/schemas/question/short/schema.json';
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

        // check there is a positive score solution
        $maxScore = -1;

        foreach ($questionData->solutions as $solution) {
            if ($solution->score > $maxScore) {
                $maxScore = $solution->score;
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
        $interaction = new InteractionOpen();

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
        $repo = $this->om->getRepository('UJMExoBundle:InteractionOpen');
        $openQuestion = $repo->findOneBy(['question' => $question]);

        $exportData->typeOpen = $openQuestion->getTypeOpenQuestion()->getValue();

        if ('long' === $exportData->typeOpen) {
            $exportData->score = [
                'type' => 'fixed',
                'success' => $openQuestion->getScoreMaxLongResp(),
                'failure' => 0,
            ];
        } elseif ('oneWord' === $exportData->typeOpen) {
            $exportData->score = [
                'type' => 'fixed',
                'success' => $openQuestion->getScoreMaxLongResp(),
                'failure' => 0,
            ];
        } else {
            $exportData->score = ['type' => 'sum'];
        }

        if ($withSolution) {
            $responses = $openQuestion->getWordResponses();

            $exportData->solutions = array_map(function ($wr) {
                $responseData = new \stdClass();
                $responseData->id = (string) $wr->getId();
                $responseData->word = $wr->getResponse();
                $responseData->caseSensitive = $wr->getCaseSensitive();
                $responseData->score = $wr->getScore();
                $responseData->feedback = $wr->getFeedback();

                return $responseData;
            }, $responses->toArray());
        }

        return $exportData;
    }

    public function convertQuestionAnswers(Question $question, \stdClass $exportData)
    {
        $repo = $this->om->getRepository('UJMExoBundle:InteractionOpen');
        $openQuestion = $repo->findOneBy(['question' => $question]);

        $responses = $openQuestion->getWordResponses();

        $exportData->solutions = array_map(function ($wr) {
            $responseData = new \stdClass();
            $responseData->id = (string) $wr->getId();
            $responseData->word = $wr->getResponse();
            $responseData->caseSensitive = $wr->getCaseSensitive();
            $responseData->score = $wr->getScore();
            $responseData->feedback = $wr->getFeedback();

            return $responseData;
        }, $responses->toArray());

        return $exportData;
    }

    /**
     * {@inheritdoc}
     */
    public function generateStats(Question $question, array $answers)
    {
        $openQuestion = $this->om->getRepository('UJMExoBundle:InteractionOpen')->findOneBy([
            'question' => $question,
        ]);

        $keywords = [];

        /** @var Response $answer */
        foreach ($answers as $answer) {
            $decoded = $this->convertAnswerDetails($answer);

            if ($openQuestion->getTypeOpenQuestion()->getValue() !== 'long') {
                // This is impossible to generate stats on long response
                /** @var WordResponse $keyword */
                foreach ($openQuestion->getWordResponses() as $keyword) {
                    $flags = $keyword->getCaseSensitive() ? 'i' : '';
                    if (1 === preg_match('/'.$keyword->getResponse().'/'.$flags, $decoded)) {
                        if (!isset($keywords[$keyword->getId()])) {
                            // First answer to contain the keyword
                            $keywords[$keyword->getId()] = new \stdClass();
                            $keywords[$keyword->getId()]->id = $keyword->getId();
                            $keywords[$keyword->getId()]->count = 0;
                        }

                        ++$keywords[$keyword->getId()]->count;
                    }
                }
            }
        }

        return $keywords;
    }

    /**
     * {@inheritdoc}
     */
    public function convertAnswerDetails(Response $response)
    {
        return $response->getResponse();
    }

    /**
     * {@inheritdoc}
     */
    public function validateAnswerFormat(Question $question, $data)
    {
        if (!is_string($data)) {
            return ['Answer data must be a string, '.gettype($data).' given'];
        }

        $count = 0;

        if (0 === $count = count($data)) {
            return ['Answer data cannot be empty'];
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
        $interaction = $this->om->getRepository('UJMExoBundle:InteractionOpen')
                ->findOneByQuestion($question);

        $answer = $data;

        $serviceOpen = $this->container->get('ujm.exo.open_service');

        $mark = $serviceOpen->mark($interaction, $data, 0);

        $response->setResponse($answer);
        $response->setMark($mark);
    }
}
