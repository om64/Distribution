<?php

namespace UJM\ExoBundle\Transfer\Json;

use Claroline\CoreBundle\Library\Testing\TransactionalTestCase;

class ValidatorTest extends TransactionalTestCase
{
    /**
     * @var Validator
     */
    private $validator;

    /**
     * @var string
     */
    private $formatDir;

    protected function setUp()
    {
        parent::setUp();
        $this->validator = $this->client->getContainer()->get('ujm.exo.json_validator');
        $vendorDir = realpath("{$this->client->getKernel()->getRootDir()}/../vendor");
        $this->formatDir = "{$vendorDir}/json-quiz/json-quiz/format";
    }

    public function testValidateQuestionWithNoType()
    {
        $errors = $this->validator->validateQuestion(new \stdClass());
        $expected = [[
            'path' => '',
            'message' => 'Question cannot be validated due to missing property "type"',
        ]];
        $this->assertEquals($expected, $errors);
    }

    public function testValidateQuestionWithUnknownType()
    {
        $question = new \stdClass();
        $question->type = 'application/x.foo+json';
        $errors = $this->validator->validateQuestion($question);
        $expected = [[
            'path' => 'type',
            'message' => "Unknown question type 'application/x.foo+json'",
        ]];
        $this->assertEquals($expected, $errors);
    }

    public function testInvalidQuestionData()
    {
        $data = file_get_contents("{$this->formatDir}/question/choice/examples/invalid/no-solution-id.json");
        $question = json_decode($data);
        $expected = [
            'path' => '/solutions/0',
            'message' => 'property "id" is missing',
        ];
        $this->assertContains($expected, $this->validator->validateQuestion($question));
    }

    public function testValidDataWithoutSolution()
    {
        $data = file_get_contents("{$this->formatDir}/question/choice/examples/valid/true-or-false.json");
        $question = json_decode($data);
        $expected = [
            'path' => '',
            'message' => 'A solution property is required',
        ];
        $this->assertContains($expected, $this->validator->validateQuestion($question));
    }

    /**
     * @dataProvider validQuestionProvider
     *
     * @param string $dataFilename
     */
    public function testValidQuestionData($dataFilename)
    {
        $data = file_get_contents("{$this->formatDir}/question/$dataFilename");
        $question = json_decode($data);
        $this->assertEquals(0, count($this->validator->validateQuestion($question)));
    }

    public function testValidateExercise()
    {
        $data = file_get_contents("{$this->formatDir}/quiz/examples/valid/content-and-question-steps.json");
        $quiz = json_decode($data);
        $this->assertEquals(0, count($this->validator->validateExercise($quiz)));

        $data = file_get_contents("{$this->formatDir}/quiz/examples/invalid/no-steps.json");
        $quiz = json_decode($data);
        $this->assertGreaterThan(0, count($this->validator->validateExercise($quiz)));
    }

    public function validQuestionProvider()
    {
        return [
            ['choice/examples/valid/solutions.json'],
            ['match/examples/valid/solutions.json'],
            ['cloze/examples/valid/multiple-answers.json'],
            ['short/examples/valid/multiple-answers.json'],
        ];
    }
}
