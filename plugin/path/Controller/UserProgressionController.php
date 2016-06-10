<?php

namespace Innova\PathBundle\Controller;

use Innova\PathBundle\Manager\UserProgressionManager;
use Symfony\Component\HttpFoundation\JsonResponse;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Method;
use Innova\PathBundle\Entity\Step;

/**
 * Class UserProgressionController.
 *
 * @Route(
 *      "/progression",
 *      service = "innova_path.controller.user_progression",
 *      requirements = {"id" = "\d+"},
 *      options      = { "expose" = true }
 * )
 */
class UserProgressionController
{
    /**
     * User Progression manager.
     *
     * @var \Innova\PathBundle\Manager\UserProgressionManager
     */
    protected $userProgressionManager;

    /**
     * Class constructor.
     *
     * @param \Innova\PathBundle\Manager\UserProgressionManager $userProgressionManager
     */
    public function __construct(UserProgressionManager $userProgressionManager)
    {
        $this->userProgressionManager = $userProgressionManager;
    }

    /**
     * Log a new action from User (mark the step as to do).
     *
     * @param \Innova\PathBundle\Entity\Step $step
     * @param string                         $status
     *
     * @return \Symfony\Component\HttpFoundation\JsonResponse
     *
     * @Route(
     *     "/step/{id}/{authorized}/{status}",
     *     name = "innova_path_progression_create"
     * )
     * @Method("POST")
     */
    public function createAction(Step $step, $status = null, $authorized = 0)
    {
        $progression = $this->userProgressionManager->create($step, null, $status, $authorized);

        return new JsonResponse($progression);
    }

    /**
     * Update progression of a User.
     *
     * @param \Innova\PathBundle\Entity\Step $step
     * @param string                         $status
     *
     * @return \Symfony\Component\HttpFoundation\JsonResponse
     *
     * @Route(
     *     "/step/{id}/{status}/{authorized}",
     *     name = "innova_path_progression_update"
     * )
     * @Method("PUT")
     */
    public function updateAction(Step $step, $status, $authorized)
    {
        $progression = $this->userProgressionManager->update($step, null, $status, $authorized);

        return new JsonResponse($progression);
    }
}
