<?php

/*
 * This file is part of the Claroline Connect package.
 *
 * (c) Claroline Consortium <consortium@claroline.net>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Claroline\CoreBundle\Form\Administration;

use Claroline\CoreBundle\Entity\Workspace\Workspace;
use Claroline\CoreBundle\Form\Angular\AngularType;
use Doctrine\ORM\EntityRepository;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolverInterface;
use Symfony\Component\Validator\Constraints\NotBlank;

class AdminHomeTabType extends AngularType
{
    private $color;
    private $locked;
    private $visible;
    private $ngAlias;
    private $forApi = false;

    public function __construct($color = null, $locked = false, $visible = true, $ngAlias = 'htfmc')
    {
        $this->color = $color;
        $this->locked = $locked;
        $this->visible = $visible;
        $this->ngAlias = $ngAlias;
    }

    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder->add('name', 'text', array('constraints' => new NotBlank(), 'label' => 'name'));
        $builder->add(
            'color',
            'text',
            array(
                'required' => false,
                'mapped' => false,
                'label' => 'color',
                'data' => $this->color,
                'attr' => array('colorpicker' => 'hex'),
            )
        );
        $builder->add(
            'visible',
            'choice',
            array(
                'choices' => array(
                    'yes' => true,
                    'no' => false,
                ),
                'label' => 'visible',
                'required' => true,
                'mapped' => false,
                // *this line is important*
                'choices_as_values' => true,
                'data' => $this->visible,
            )
        );
        $builder->add(
            'locked',
            'choice',
            array(
                'choices' => array(
                    'yes' => true,
                    'no' => false,
                ),
                'label' => 'locked',
                'mapped' => false,
                'required' => true,
                'choices_as_values' => true,
                'data' => $this->locked,
            )
        );
        $builder->add(
            'roles',
            'entity',
            array(
                'label' => 'roles',
                'class' => 'ClarolineCoreBundle:Role',
                'choice_translation_domain' => true,
                'query_builder' => function (EntityRepository $er) {
                    return $er->createQueryBuilder('r')
                        ->where('r.workspace IS NULL')
                        ->andWhere('r.type = 1')
                        ->andWhere('r.name != :anonymousRole')
                        ->setParameter('anonymousRole', 'ROLE_ANONYMOUS')
                        ->orderBy('r.translationKey', 'ASC');
                },
                'property' => 'translationKey',
                'expanded' => true,
                'multiple' => true,
                'required' => false,
            )
        );
    }

    public function getName()
    {
        return 'home_tab_form';
    }

    public function setDefaultOptions(OptionsResolverInterface $resolver)
    {
        $default = array('translation_domain' => 'platform');

        if ($this->forApi) {
            $default['csrf_protection'] = false;
        }
        $default['ng-model'] = 'homeTab';
        $default['ng-controllerAs'] = $this->ngAlias;

        $resolver->setDefaults($default);
    }

    public function enableApi()
    {
        $this->forApi = true;
    }
}
