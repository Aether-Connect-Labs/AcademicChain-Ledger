<?php
/*
Plugin Name: AcademicChain Credential Verifier
Description: Embed AcademicChain credential verification in your WordPress site
*/

function academicchain_verifier_shortcode($atts) {
    $atts = shortcode_atts([
        'width' => '100%',
        'height' => '500px'
    ], $atts);

    return '
    <div id="academicchain-verifier" style="width: '.esc_attr($atts['width']).'; height: '.esc_attr($atts['height']).';">
        <iframe 
            src="'.esc_url(ACADEMICCHAIN_EMBED_URL).'" 
            frameborder="0" 
            style="width:100%;height:100%;"
        ></iframe>
    </div>';
}
add_shortcode('academicchain_verifier', 'academicchain_verifier_shortcode');

class AcademicChain_Widget extends WP_Widget {
    public function __construct() {
        parent::__construct(
            'academicchain_widget',
            'AcademicChain Verifier',
            ['description' => 'Embed a credential verification widget']
        );
    }

    public function widget($args, $instance) {
        echo $args['before_widget'];
        echo $args['before_title'] . 'Verify Credential' . $args['after_title'];
        echo do_shortcode('[academicchain_verifier width="100%" height="300px"]');
        echo $args['after_widget'];
    }
}

function register_academicchain_widget() {
    register_widget('AcademicChain_Widget');
}
add_action('widgets_init', 'register_academicchain_widget');
