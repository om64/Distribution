<?php

namespace Innova\MediaResourceBundle\Form\Type;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolverInterface;

/**
 * Description of ContextType.
 */
class OptionsType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder->add('showAutoPauseView', 'checkbox', array(
                            'label' => 'options_form_auto_pause_view',
                            'required' => false,
                    )
                )
                ->add('showLiveView', 'checkbox', array(
                            'label' => 'options_form_live_view',
                            'required' => false,
                    )
                )
                ->add('showActiveView', 'checkbox', array(
                            'label' => 'options_form_active_view',
                            'required' => false,
                    )
                )
                ->add('showExerciseView', 'checkbox', array(
                            'label' => 'options_form_exercise_view',
                            'required' => false,
                    )
                )
                ->add('showRegionNote', 'checkbox', array(
                            'label' => 'options_form_enable_text_transcription',
                            'required' => false,
                    )
                )
                ->add('ttsLanguage', 'choice', array(
                            'choices' => [
                              'en-US' => 'options_form_tts_choices_en_US',
                              'en-GB' => 'options_form_tts_choices_en_GB',
                              'de-DE' => 'options_form_tts_choices_de_DE',
                              'es-ES' => 'options_form_tts_choices_es_ES',
                              'fr-FR' => 'options_form_tts_choices_fr_FR',
                              'it-IT' => 'options_form_tts_choices_it_IT',
                              ],
                              'expanded' => false,
                              'multiple' => false,
                              'label' => 'options_form_tts_language',
                              'required' => true,
                    )
                );
    }

    public function getDefaultOptions()
    {
        return array(
            'data_class' => 'Innova\MediaResourceBundle\Entity\Options',
            'translation_domain' => 'resource_form',
        );
    }

    public function setDefaultOptions(OptionsResolverInterface $resolver)
    {
        $resolver->setDefaults($this->getDefaultOptions());

        return $this;
    }

    public function getName()
    {
        return 'media_resource_options';
    }
}
