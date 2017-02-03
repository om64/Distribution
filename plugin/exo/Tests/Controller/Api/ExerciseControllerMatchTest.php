<?php

namespace UJM\ExoBundle\Tests\Controller\Api;

use Claroline\CoreBundle\Entity\User;
use Claroline\CoreBundle\Library\Testing\TransactionalTestCase;
use Claroline\CoreBundle\Persistence\ObjectManager;
use UJM\ExoBundle\Entity\Exercise;
use UJM\ExoBundle\Entity\Question;
use UJM\ExoBundle\Testing\Persister;
use UJM\ExoBundle\Testing\RequestTrait;

/**
 * Tests that are specific to MatchQuestionType.
 */
class ExerciseControllerMatchTest extends TransactionalTestCase
{
    use RequestTrait;

    /** @var ObjectManager */
    private $om;
    /** @var Persister */
    private $persist;
    /** @var User */
    private $john;
    /** @var User */
    private $bob;
    /** @var User */
    private $admin;
    /** @var Label */
    private $lab1;
    /** @var Label */
    private $lab2;
    /** @var Proposal */
    private $prop1;
    /** @var Proposal */
    private $prop2;
    /** @var Proposal */
    private $prop3;
    /** @var Question */
    private $qu1;
    /** @var Exercise */
    private $ex1;

    protected function setUp()
    {
        parent::setUp();
        $this->om = $this->client->getContainer()->get('claroline.persistence.object_manager');
        $manager = $this->client->getContainer()->get('ujm.exo.paper_manager');
        $this->persist = new Persister($this->om, $manager);
        $this->john = $this->persist->user('john');
        $this->bob = $this->persist->user('bob');

        $this->persist->role('ROLE_ADMIN');
        $this->admin = $this->persist->user('admin');

        // real label that will be associated with proposals
        $this->lab1 = $this->persist->matchLabel('fruit', 2);
        // orphan label that will have 0 associated proposal
        $this->lab2 = $this->persist->matchLabel('vegetable');

        $this->prop1 = $this->persist->matchProposal('peach', $this->lab1);
        $this->prop2 = $this->persist->matchProposal('apple', $this->lab1);
        // proposal without any associated label
        $this->prop3 = $this->persist->matchProposal('duck');

        $this->qu1 = $this->persist->matchQuestion('match1', [$this->lab1, $this->lab2], [$this->prop1, $this->prop2, $this->prop3]);
        $this->ex1 = $this->persist->exercise('ex1', [$this->qu1], $this->john);
        $this->om->flush();
    }

    public function testSubmitAnswerInInvalidFormat()
    {
        $pa1 = $this->persist->paper($this->john, $this->ex1);
        $this->om->flush();

        $step = $this->ex1->getSteps()->get(0);

        $this->request(
            'PUT',
            "/exercise/api/papers/{$pa1->getId()}/steps/{$step->getId()}",
            $this->john,
            [
                'data' => [$this->qu1->getId() => 'not a proposal id,not a label id'],
            ]
        );

        $this->assertEquals(422, $this->client->getResponse()->getStatusCode());
    }

    public function testSubmitAnswer()
    {
        $pa1 = $this->persist->paper($this->john, $this->ex1);
        $this->om->flush();

        $propId1 = (string) $this->prop1->getId();
        $propId2 = (string) $this->prop2->getId();
        $labelId = (string) $this->lab1->getId();

        $step = $this->ex1->getSteps()->get(0);

        $this->request(
            'PUT',
            "/exercise/api/papers/{$pa1->getId()}/steps/{$step->getId()}",
            $this->john,
            [
                'data' => [$this->qu1->getId() => [$propId1.','.$labelId, $propId2.','.$labelId]],
            ]
        );

        $this->assertEquals(204, $this->client->getResponse()->getStatusCode());
    }
}
