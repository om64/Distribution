<?php

namespace Innova\PathBundle\Controller;

use Claroline\CoreBundle\Entity\User;
use Claroline\TeamBundle\Manager\TeamManager;
use Innova\PathBundle\Entity\Path\Path;
use Symfony\Component\HttpFoundation\JsonResponse;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Method;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\ParamConverter;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Claroline\CoreBundle\Persistence\ObjectManager;
use Claroline\CoreBundle\Manager\GroupManager;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;

/**
 * Class StepConditionController.
 *
 * @Route(
 *      "/condition",
 *      options = {"expose" = true},
 *      service = "innova_path.controller.step_condition"
 * )
 */
class StepConditionController extends Controller
{
    /**
     * Object manager.
     *
     * @var \Doctrine\Common\Persistence\ObjectManager
     */
    private $om;
    private $groupManager;
    private $teamManager;

    /**
     * Security Token.
     *
     * @var \Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface
     */
    protected $securityToken;

    /**
     * Constructor.
     *
     * @param ObjectManager         $objectManager
     * @param GroupManager          $groupManager
     * @param TokenStorageInterface $securityToken
     * @param TeamManager           $teamManager
     */
    public function __construct(
        ObjectManager $objectManager,
        GroupManager $groupManager,
        TokenStorageInterface $securityToken,
        TeamManager $teamManager
    ) {
        $this->groupManager = $groupManager;
        $this->om = $objectManager;
        $this->securityToken = $securityToken;
        $this->teamManager = $teamManager;
    }
    /**
     * Get user group for criterion.
     *
     * @return \Symfony\Component\HttpFoundation\JsonResponse
     *
     * @Route(
     *     "/group",
     *     name = "innova_path_criteria_groups"
     * )
     * @Method("GET")
     */
    public function listGroupsAction()
    {
        $data = [];

        $groups = $this->groupManager->getAll();
        if ($groups) {
            // data needs to be explicitly set because Group does not extends Serializable

            /** @var \Claroline\CoreBundle\Entity\Group $group */
            foreach ($groups as $group) {
                $data[$group->getId()] = $group->getName();
            }
        }

        return new JsonResponse($data);
    }

    /**
     * Get list of groups a user belongs to.
     *
     * @param User $user
     *
     * @return \Symfony\Component\HttpFoundation\JsonResponse
     *
     * @Route(
     *     "/group/current_user",
     *     name = "innova_path_criteria_user_groups"
     * )
     * @Method("GET")
     * @ParamConverter("user", converter="current_user", options={"allowAnonymous"=true})
     */
    public function listUserGroupsAction(User $user = null)
    {
        $data = [];
        if ($user) {
            // Retrieve Groups of the User
            $groups = $user->getGroups();

            // data needs to be explicitly set because Group does not extends Serializable
            foreach ($groups as $group) {
                $data[$group->getId()] = $group->getName();
            }
        }

        return new JsonResponse($data);
    }

    /**
     * Get evaluation data for an activity.
     *
     * @return \Symfony\Component\HttpFoundation\JsonResponse
     *
     * @Route(
     *     "/activityeval/{activityId}",
     *     name         = "innova_path_activity_eval",
     *     options      = { "expose" = true }
     * )
     * @Method("GET")
     */
    public function getActivityEvaluation($activityId)
    {
        $data = [
            'status' => 'NA',
            'attempts' => 0,
        ];

        //retrieve activity
        $activity = $this->om->getRepository('ClarolineCoreBundle:Resource\Activity')
            ->findOneBy(array('id' => $activityId));

        if ($activity !== null) {
            //retrieve evaluation data for this activity
            $evaluation = $this->om->getRepository('ClarolineCoreBundle:Activity\Evaluation')
                ->findOneBy(array('activityParameters' => $activity->getParameters()));

            //return relevant data
            if ($evaluation !== null) {
                $data = array(
                    'status' => $evaluation->getStatus(),
                    'attempts' => $evaluation->getAttemptsCount(),
                );
            }
        }

        return new JsonResponse($data);
    }

    /**
     * Get list of Evaluation statuses to display in select
     * (data from \CoreBundle\Entity\Activity\AbstractEvaluation.php).
     *
     * @Route(
     *     "/activity/statuses",
     *     name = "innova_path_criteria_activity_statuses",
     * )
     * @Method("GET")
     *
     * @return JsonResponse
     */
    public function listActivityStatusesAction()
    {
        $r = new \ReflectionClass('Claroline\CoreBundle\Entity\Activity\AbstractEvaluation');

        // Get class constants
        $const = $r->getConstants();
        $statuses = [];
        foreach ($const as $k => $v) {
            // Only get constants beginning with STATUS
            if (strpos($k, 'STATUS') !== false) {
                $statuses[] = $v;
            }
        }

        return new JsonResponse($statuses);
    }

    /**
     * Get evaluation for all Activities of a path.
     *
     * @param Path $path
     *
     * @return \Symfony\Component\HttpFoundation\JsonResponse
     *
     * @Route(
     *     "/{id}/evaluation",
     *     name = "innova_path_evaluation"
     * )
     * @Method("GET")
     */
    public function getAllEvaluationsByUserByPath(Path $path)
    {
        $user = $this->securityToken->getToken()->getUser();
        $results = $this->om->getRepository('InnovaPathBundle:StepCondition')
            ->findAllEvaluationsByUserAndByPath($path, $user);

        $data = [];
        foreach ($results as $r) {
            $data[] = array(
                'eval' => array(
                    'id' => $r->getId(),
                    'attempts' => $r->getAttemptsCount(),
                    'status' => $r->getStatus(),
                    'score' => $r->getScore(),
                    'numscore' => $r->getNumScore(),
                    'scooremin' => $r->getScoreMin(),
                    'scoremax' => $r->getScoreMax(),
                    'type' => $r->getType(),
                ),
                'evaltype' => $r->getActivityParameters()->getEvaluationType(),
                'idactivity' => $r->getActivityParameters()->getActivity()->getId(),
                'activitytitle' => $r->getActivityParameters()->getActivity()->getTitle(),
            );
        }

        return new JsonResponse($data);
    }

    /**
     * Get list of teams available in the Workspace of the current Path
     *
     * @param Path $path
     *
     * @return \Symfony\Component\HttpFoundation\JsonResponse
     *
     * @Route(
     *     "/team/{id}",
     *     name = "innova_path_criteria_teams"
     * )
     * @Method("GET")
     */
    public function listTeamsAction(Path $path)
    {
        $data = [];

        // retrieve list of groups object for this user
        $teams = $this->teamManager->getTeamsByWorkspace($path->getWorkspace());
        if ($teams) {
            // data needs to be explicitly set because Team does not extends Serializable

            /** @var \Claroline\TeamBundle\Entity\Team $team */
            foreach ($teams as $team) {
                $data[$team->getId()] = $team->getName();
            }
        }

        return new JsonResponse($data);
    }

    /**
     * Get list of teams a user belongs to.
     *
     * @param User $user
     *
     * @return \Symfony\Component\HttpFoundation\JsonResponse
     *
     * @Route(
     *     "/team/current_user",
     *     name = "innova_path_criteria_user_teams"
     * )
     * @Method("GET")
     * @ParamConverter("user", converter="current_user", options={"allowAnonymous"=true})
     */
    public function listUserTeamsAction(User $user = null)
    {
        $data = [];
        if ($user) {
            // retrieve list of team object for this user
            $teams = $this->teamManager->getTeamsByUser($user, 'name', 'ASC', true);
            if ($teams) {
                // data needs to be explicitly set because Team does not extends Serializable

                /** @var \Claroline\TeamBundle\Entity\Team $team */
                foreach ($teams as $team) {
                    $data[$team->getId()] = $team->getName();
                }
            }
        }

        return new JsonResponse($data);
    }
}
