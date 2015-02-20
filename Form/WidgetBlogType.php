<?php

namespace Icap\BlogBundle\Form;

use Icap\BlogBundle\Form\DataTransformer\IntToBlogTransformer;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolverInterface;
use Zenstruck\Bundle\FormBundle\Form\DataTransformer\AjaxEntityTransformer;
use JMS\DiExtraBundle\Annotation as DI;

/**
 * @DI\Service("icap_blog.form.widget_blog")
 * @DI\FormType(alias = "blog_widget_blog_form")
 */
class WidgetBlogType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder->add('resourceNode', 'resourcePicker', array(
            'theme_options' => array(
                'label_width'   => 'col-md-6',
                'control_width' => 'col-md-6'
            ),
            'attr' => array(
                'data-restrict-for-owner'             => 1,
                'data-is-picker-multi-select-allowed' => 0,
                'data-is-directory-selection-allowed' => 0,
                'data-type-white-list'                => 'icap_blog',
                'data-display-download-button'        => 0,
                'data-display-browse-button'          => 0
            )
        ));
    }

    public function getName()
    {
        return 'blog_widget_blog_form';
    }

    public function setDefaultOptions(OptionsResolverInterface $resolver)
    {
        $resolver->setDefaults(
            array(
                'data_class'         => 'Icap\BlogBundle\Entity\WidgetBlog',
                'translation_domain' => 'icap_blog'
            )
        );
    }
}