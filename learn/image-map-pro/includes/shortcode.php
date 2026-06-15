<?php

if (!class_exists('ImageMapPro_Shortcode')) {
  class ImageMapPro_v6_Shortcode {
		public $version;
		public $storage;
		public $used_shortcodes = [];
		private $footer_script_added = false;

    function __construct($storage, $version) {
			$this->version = $version;
			// Get a reference to the storage
      $this->storage = $storage;

      // Generate the shortcodes
      foreach ($this->storage->load_projects_as_objects() as $project) {
				if (isset($project->shortcode) && strlen($project->shortcode) > 0) {
					add_shortcode($project->shortcode, array($this, 'print_shortcode'));
				}
			}

      // // Register the client script
      add_action('wp_enqueue_scripts', array($this, 'register_client_script'));
    }
    function register_client_script() {
			wp_register_script('image-map-pro', plugins_url('../js/client/main.js', __FILE__), false, $this->version, true);
		}
    function print_shortcode($a, $b, $shortcode) {			
      $project = $this->storage->get_project_by_shortcode($shortcode);
			$result = '';

      if ($project) {
        $result = '<div><div id="image-map-pro-'. esc_attr($project->id) .'"></div></div>';

        $this->used_shortcodes[] = $shortcode;

        if (!$this->footer_script_added) {
          add_action('wp_footer', array($this, 'footer_script'));
          $this->footer_script_added = true;
        }
      }

			return $result;
		}
    function footer_script() {
      wp_enqueue_script('image-map-pro');

      $projects = $this->storage->load_projects_as_objects();

			foreach ($projects as $project) {
				if (!in_array($project->shortcode, $this->used_shortcodes)) {
					continue;
				}
				
				?>
				<script>
					;(function () {
						setTimeout(() => {
							if (canLaunchImageMapPro()) {
								launchImageMapPro()
								return
							} else {
								const interval = setInterval(() => {
									if (!canLaunchImageMapPro()) {
										return
									} else {
										clearInterval(interval)
										launchImageMapPro()
									}
								}, 250)
							}
						}, 1)

						function canLaunchImageMapPro() {
							try {
								return ImageMapPro && document.querySelector("#image-map-pro-<?php echo esc_js($project->id) ?>")
							} catch(err) {
								return false
							}
						}
						function launchImageMapPro() {
							<?php
								$expanded = $this->expand_shortcodes($project->json);
								// Re-decode and re-encode with wp_json_encode for safe JS output
								$decoded_settings = json_decode($expanded);
								if ($decoded_settings !== null) {
									echo 'const settings = ' . wp_json_encode($decoded_settings) . ';' . "\n";
								} else {
									echo 'const settings = {};' . "\n";
								}
								echo 'ImageMapPro.init("#image-map-pro-' . esc_js($project->id) . '", settings)';
							?>
						}
					})();
				</script>
				<?php

				$parsed = json_decode($project->json);

				if (isset($parsed->custom_code->custom_css) && strlen($parsed->custom_code->custom_css) > 0) {
					$css = $this->format_custom_code($parsed->custom_code->custom_css);
					// Strip any closing style tags to prevent injection
					$css = preg_replace('/<\/style/i', '', $css);
					echo '<style type="text/css">' . $css . '</style>';
				}
				if (isset($parsed->custom_code->custom_js) && strlen($parsed->custom_code->custom_js) > 0) {
					$js = $this->format_custom_code($parsed->custom_code->custom_js);
					// Strip any closing script tags to prevent injection
					$js = preg_replace('/<\/script/i', '', $js);
					echo '<script>' . $js . '</script>' . "\n";
				}
			}
    }
    function format_custom_code($code) {
      $formatted = str_replace('\n', " ", $code);
      $formatted = preg_replace("/\s+/", " ", $formatted);
      $formatted = preg_replace("/<br>/", '', $formatted);
      $formatted = preg_replace("/\\\\t/", ' ', $formatted);

      return $formatted;
    }
	function expand_shortcodes($json) {
		// register a test shortcode
		add_shortcode('test', function($atts, $content) {
			return '<strong>this is a test shortcode</strong>';
		});

		// decode json
		$json = json_decode($json);

		// check if json is object
		if (!is_object($json)) {
			return;
		}

		// iterate over each item in prop "children" of json->artboards
		// check if artboards is null
		foreach ((array)($json->artboards ?? []) as $artboard) {
			foreach ((array)($artboard->children ?? []) as $child) {
				$this->expand_shortcode_for_object($child);
			}
		}

		// encode back to json and return
		return json_encode($json);
	}
	function expand_shortcode_for_object($object) {
		if (isset($object->tooltip_content)) {
			foreach ($object->tooltip_content as $content) {
				if (isset($content->text)) {
					$content->text = do_shortcode($content->text);
				}
			}
		}

		if (isset($object->children)) {
			foreach ($object->children as $child) {
				$this->expand_shortcode_for_object($child);
			}
		}
	}
  }
}

?>