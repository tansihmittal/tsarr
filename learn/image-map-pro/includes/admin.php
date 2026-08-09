<?php

if (!class_exists('ImageMapPro_Admin')) {
	class ImageMapPro_v6_Admin {
		public $version;
		public $pagename;
		public $new_pagename;
		
    function __construct($version) {
			$this->version = $version;
      $this->pagename = 'image-map-pro-wordpress-v6fdsfsd';
			$this->new_pagename = 'new_image-map-pro-wordpress-v6';

      add_action('admin_menu', array($this, 'init_pages'));
      add_action('admin_enqueue_scripts', array($this, 'register_admin_includes'));
      add_action('wp_ajax_image_map_pro_get_editor_script_url', array($this, 'get_editor_script_url'));
    }
    function init_pages() {
			add_menu_page('Image Map Pro v6', 'Image Map Pro', 'can_use_image_map_pro', $this->pagename, array($this, 'print_options_page'));
		} 
    function register_admin_includes() {
			wp_register_script('image-map-pro-admin-js', plugins_url('../js/admin.js', __FILE__), false, $this->version, false);
			wp_register_style('image-map-pro-admin-css', plugins_url('../css/admin.css', __FILE__), false, $this->version, false);

			wp_localize_script('image-map-pro-admin-js', 'image_map_pro_locals', array(
				'url' => admin_url('admin-ajax.php'),
				'nonce' => wp_create_nonce('image_map_pro')
				));
		}
		function print_options_page() {
			wp_enqueue_media();
			wp_enqueue_script('image-map-pro-admin-js');
			wp_enqueue_style('image-map-pro-admin-css');
			
			?>
				<div id='image-map-pro-admin'>

					<h1>Image Map Pro</h1>
					<h4>Version: <?php echo esc_html($this->version) ?></h4>

					<p>Thank you for using ImageMap Pro! For customer support please visit <a href='https://imagemappro.com/support' target='_blank'>https://imagemappro.com/support</a> </p>

					<div id='button-launch-editor'>Launch Editor</div>
				</div>
			<?php
		}
		function get_editor_script_url() {
			if (!wp_verify_nonce($_POST['nonce'], 'image_map_pro')) {
				die('Invalid nonce');
			}

			if (!current_user_can('can_use_image_map_pro')) {
					die('You do not have permission to do this');
			}

			// generate random string with length 24
			$randomString = substr(str_shuffle(str_repeat($x='0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', ceil(24/strlen($x)) )),1,24);

			// generate URL
			$url = plugins_url('../js/editor/main.js', __FILE__);
			$url .= '?q=' . $randomString;

			echo esc_url($url);
			die();
		}
  }
}

?>