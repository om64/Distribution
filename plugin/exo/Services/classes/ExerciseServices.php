<?php

namespace UJM\ExoBundle\Services\classes;

use Claroline\CoreBundle\Entity\User;
use Claroline\CoreBundle\Library\Resource\ResourceCollection;
use Claroline\CoreBundle\Persistence\ObjectManager;
use Doctrine\Bundle\DoctrineBundle\Registry;
use Symfony\Component\DependencyInjection\Container;
use Symfony\Component\Security\Core\Authorization\AuthorizationCheckerInterface;
use UJM\ExoBundle\Entity\Question;
use UJM\ExoBundle\Entity\Exercise;
use UJM\ExoBundle\Entity\Step;
use UJM\ExoBundle\Entity\StepQuestion;

/**
 * @deprecated prefer the use of UJM\ExoBundle\Manager\ExerciseManager to add new methods
 */
class ExerciseServices
{
    protected $om;
    protected $authorizationChecker;
    protected $doctrine;
    protected $container;

    /**
     * Constructor.
     *
     *
     * @param \Claroline\CoreBundle\Persistence\ObjectManager                              $om
     * @param \Symfony\Component\Security\Core\Authorization\AuthorizationCheckerInterface $authorizationChecker
     * @param \Doctrine\Bundle\DoctrineBundle\Registry                                     $doctrine
     * @param \Symfony\Component\DependencyInjection\Container                             $container
     */
    public function __construct(
        ObjectManager $om,
        AuthorizationCheckerInterface $authorizationChecker,
        Registry $doctrine,
        Container $container
    ) {
        $this->om = $om;
        $this->authorizationChecker = $authorizationChecker;
        $this->doctrine = $doctrine;
        $this->container = $container;
    }

    /**
     * Return the number of papers for an exercise and for an user.
     *
     *
     * @param int  $uid      id User
     * @param int  $exoID    id Exercise
     * @param bool $finished to count or no paper n o finished
     *
     * @return int
     */
    public function getNbPaper($uid, $exoID, $finished = false)
    {
        $papers = $this->om
                       ->getRepository('UJMExoBundle:Paper')
                       ->getExerciseUserPapers($uid, $exoID, $finished);

        return count($papers);
    }

    /**
     * Get max score possible for an exercise.
     *
     *
     * @param Exercise $exercise
     *
     * @return float
     */
    public function getExerciseTotalScore(Exercise $exercise)
    {
        $exoTotalScore = 0;

        $questions = $this->om
                    ->getRepository('UJMExoBundle:Question')
                    ->findByExercise($exercise);

        foreach ($questions as $question) {
            $typeInter = $question->getType();
            $interSer = $this->container->get('ujm.exo_'.$typeInter);
            $interactionX = $interSer->getInteractionX($question->getId());
            $scoreMax = $interSer->maxScore($interactionX);
            $exoTotalScore += $scoreMax;
        }

        return $exoTotalScore;
    }

    /**
     * To know if an user is the creator of an exercise.
     *
     *
     * @param Exercise $exercise
     *
     * @return bool
     */
    public function isExerciseAdmin(Exercise $exercise)
    {
        $collection = new ResourceCollection([$exercise->getResourceNode()]);
        if ($this->authorizationChecker->isGranted('ADMINISTRATE', $collection)) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * For all papers for an user and an exercise get scorePaper, maxExoScore, scoreTemp (all questions marked or no).
     *
     *
     * @param int $userId id User
     * @param int $exoId  id Exercise
     *
     * @return array
     */
    public function getScoresUser($userId, $exoId)
    {
        $tabScoresUser = array();
        $i = 0;

        $papers = $this->om
                       ->getRepository('UJMExoBundle:Paper')
                       ->getExerciseUserPapers($userId, $exoId);

        foreach ($papers as $paper) {
            $infosPaper = $this->container->get('ujm.exo_paper')->getInfosPaper($paper);
            $tabScoresUser[$i]['score'] = $infosPaper['scorePaper'];
            $tabScoresUser[$i]['maxExoScore'] = $infosPaper['maxExoScore'];
            $tabScoresUser[$i]['scoreTemp'] = $infosPaper['scoreTemp'];

            ++$i;
        }

        return $tabScoresUser;
    }

    /**
     * To control the max attempts, allow to know if an user can again execute an exercise.
     *
     *
     * @param \UJM\ExoBundle\Entity\Exercise $exercise
     * @param int                            $uid
     * @param bool                           $exoAdmin
     *
     * @return bool
     */
    public function controlMaxAttemps($exercise, $uid, $exoAdmin)
    {
        if (($exoAdmin === false) && ($exercise->getMaxAttempts() > 0)
            && ($exercise->getMaxAttempts() <= $this->getNbPaper($uid,
            $exercise->getId(), true))
        ) {
            return false;
        } else {
            return true;
        }
    }

    /**
     * Add an Interaction in an exercise if created from an exercise.
     *
     *
     * @param Question $question
     * @param Exercise $exercise
     * @param Step     $step
     */
    public function addQuestionInExercise(Question $question, Exercise $exercise, Step $step = null)
    {
        if (null === $step) {
            // Create a new Step to add the Question
            $this->createStepForOneQuestion($exercise, $question, 1);
        } else {
            // Add the question to the existing Step
            $em = $this->doctrine->getManager();

            $sq = new StepQuestion();
            $sq->setOrdre($step->getStepQuestions()->count() + 1);
            $sq->setStep($step);
            $sq->setQuestion($question);

            $em->persist($sq);
            $em->flush();
        }
    }

    /**
     * Add a question in a step.
     *
     *
     * @param Question $question
     * @param Step     $step
     * @param int      $order
     *
     * @deprecated Use StepManager::addQuestion(Step $step, Question $question, $order = -1) instead
     */
    public function addQuestionInStep($question, $step, $order)
    {
        if ($step != null) {
            $sq = new StepQuestion();

            if ($order == -1) {
                $order = $step->getStepQuestions()->count() + 1;
            }

            $sq->setOrdre($order);
            $sq->setStep($step);
            $sq->setQuestion($question);

            $this->om->persist($sq);
            $this->om->flush();
        }
    }

    /**
     * @deprecated
     *
     * @return User
     */
    public function getUser()
    {
        return $this->container->get('security.token_storage')->getToken()->getUser();
    }

    /**
     * @return int or String
     *
     * @deprecated
     */
    public function getUserId()
    {
        $user = $this->getUser();
        if (is_object($user)) {
            $uid = $user->getId();
        } else {
            $uid = 'anonymous';
        }

        return $uid;
    }

    /**
     * Temporary : Waiting step manager.
     *
     * Create a step for one question in the exercise
     *
     * @param Exercise $exercise
     * @param Question $question
     * @param int      $orderStep order of the step in the exercise
     */
    public function createStepForOneQuestion(Exercise $exercise, Question $question, $orderStep)
    {
        $em = $this->doctrine->getManager();
        $step = $this->createStep($exercise, $orderStep);

        $sq = new StepQuestion();
        $sq->setStep($step);
        $sq->setQuestion($question);
        $sq->setOrdre(1);
        $em->persist($sq);
        $em->flush();
    }

    /**
     * @param Exercise $exercise
     * @param int      $orderStep
     *
     * @return Step
     */
    public function createStep(Exercise $exercise, $orderStep)
    {
        $em = $this->doctrine->getManager();

        //Creating a step by question
        $step = new Step();
        $step->setText(' ');
        $step->setExercise($exercise);
        $step->setNbQuestion(0);
        $step->setDuration(0);
        $step->setMaxAttempts(0);
        $step->setOrder($orderStep);

        $em->persist($step);

        return $step;
    }
}
