<?php

if (!class_exists('ImageMapPro_Gutenberg')) {
	class ImageMapPro_v6_Gutenberg {

    function __construct() {
      add_action('enqueue_block_editor_assets', array($this, 'enqueue_block_editor_assets'));	
    }
		function enqueue_block_editor_assets() {			
			wp_enqueue_script(
				'image-map-pro-wordpress-block-js',
				plugins_url('../js/gutenberg.js', __FILE__), 
				array('wp-blocks', 'wp-element', 'wp-components')
			);
			wp_localize_script('image-map-pro-wordpress-block-js', 'image_map_pro_locals', array(
				'url' => admin_url('admin-ajax.php'),
				'nonce' => wp_create_nonce('image_map_pro')
			));
		}
  }
}

?>