<?php

namespace Innova\MediaResourceBundle\Form\Type;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolverInterface;

/**
 * Description of OptionsType.
 */
class OptionsType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder->add('mode', 'choice', array(
                            'label' => 'options_form_view_mode',
                            'required' => true,
                            'choices' => [
                              'live' => 'options_form_view_mode_choices_live',
                              'pause' => 'options_form_view_mode_choices_pause',
                              'free' => 'options_form_view_mode_choices_free',
                              'active' => 'options_form_view_mode_choices_active',
                              ],
                              'expanded' => true,
                              'multiple' => false,
                    )
                )
                ->add('showTextTranscription', 'checkbox', array(
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
