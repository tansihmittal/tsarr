<?php
  if (!class_exists('ImageMapPro_Storage')) {
    class ImageMapPro_v6_Storage {
      public $admin_options_name;
      public $admin_options_name_before_v6;
      
      function __construct() {
        $this->admin_options_name = 'image-map-pro-wordpress-admin-options-v6';
        $this->admin_options_name_before_v6 = 'image-map-pro-wordpress-admin-options';
        
        add_action('wp_ajax_image_map_pro_load_projects', array($this, 'load_projects'));
        add_action('wp_ajax_image_map_pro_load_projects_only_name_and_shortcode', array($this, 'load_projects_only_name_and_shortcode'));
        
        // Editor functions
        add_action('wp_ajax_image_map_pro_get_last_project_id', array($this, 'get_last_project_id'));
        add_action('wp_ajax_image_map_pro_get_projects_list', array($this, 'get_projects_list'));
        add_action('wp_ajax_image_map_pro_get_project', array($this, 'get_project'));
        add_action('wp_ajax_image_map_pro_save_project', array($this, 'save_project'));
        add_action('wp_ajax_image_map_pro_delete_project', array($this, 'delete_project'));

        // Deprecated
        add_action('wp_ajax_image_map_pro_load_project', array($this, 'load_project'));
        
        $this->init_storage();
        $this->migrate_old_options();
      }
      function get_admin_options() {
        $options = get_option($this->admin_options_name);
        if (!is_array($options)) {
          $options = array(
            'lastProjectID' => ''
          );
          update_option($this->admin_options_name, $options);
        }
        return $options;
      }
      function init_storage() {
        global $wpdb;

        $table_name = $wpdb->prefix . 'image_map_pro_projects';
        $charset_collate = $wpdb->get_charset_collate();

        if ($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
          $sql = "CREATE TABLE $table_name (
            id varchar(36) NOT NULL,
            name tinytext NOT NULL,
            shortcode tinytext NOT NULL,
            json longtext NOT NULL,
            PRIMARY KEY  (id)
          ) $charset_collate;";

          require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
          dbDelta($sql);
        }
      }
      function migrate_old_options() {
        // Check if old options exist and have not been migrated
        $old_options = get_option($this->admin_options_name_before_v6);
        if ($old_options['migrated'] == true) {
          return;
        }

        // Migrate old options
        $first_id = '';
        foreach ($old_options['saves'] as $key => $value) {
          $id = json_decode(stripslashes($value['json']))->id;
          if ($first_id == '') {
            $first_id = $id;
          }

          // write to db
          global $wpdb;
          $table_name = $wpdb->prefix . 'image_map_pro_projects';
          $wpdb->insert(
            $table_name,
            array(
              'id' => $id,
              'name' => $value['meta']['name'],
              'shortcode' => $value['meta']['shortcode'],
              'json' => $value['json']
            )
          );
        }

        // Set last project id to the last project in the old options
        $options = $this->get_admin_options();
        $options['lastProjectID'] = $first_id;
        update_option($this->admin_options_name, $options);
        
        // Mark old options as migrated
        $old_options['migrated'] = true;
        update_option($this->admin_options_name_before_v6, $old_options);
      }
      function verify_nonce() {
        if (function_exists('wp_verify_nonce')) {
          if (!wp_verify_nonce($_POST['nonce'], 'image_map_pro')) {
            die('Invalid nonce');
          }
        }
      }
      function verify_capabilities() {
        if (!current_user_can('can_use_image_map_pro')) {
          die('You do not have permission to do this');
        }
      }

      // Shortcode functions
      function load_projects() {        
        $this->verify_nonce();
        $this->verify_capabilities();
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'image_map_pro_projects';
        $projects = $wpdb->get_results("SELECT * FROM $table_name ORDER BY name ASC");

        // strip slashes from each project's json
        foreach ($projects as $key => $value) {
          $projects[$key]->json = stripslashes($value->json);
        }

        $result = wp_json_encode($projects);
        echo $result;

			  die();
      }
      function load_projects_only_name_and_shortcode() {        
        $this->verify_nonce();
        $this->verify_capabilities();
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'image_map_pro_projects';
        $projects = $wpdb->get_results("SELECT * FROM $table_name ORDER BY name ASC");

        // strip slashes from each project's json
        foreach ($projects as $key => $value) {
          $projects[$key]->json = stripslashes($value->json);
        }

        $projects_trimmed = array();
        foreach ($projects as $key => $value) {
          $projects_trimmed[$key] = array(
            'name' => $value->name,
            'shortcode' => $value->shortcode
          );
        }

        $result = wp_json_encode($projects_trimmed);
        echo $result;

			  die();
      }
      function load_projects_as_objects() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'image_map_pro_projects';
        $projects = $wpdb->get_results("SELECT * FROM $table_name ORDER BY name ASC");

        // strip slashes from each project's json
        foreach ($projects as $key => $value) {
          $projects[$key]->json = stripslashes($value->json);
        }

        return $projects;
      }
      function get_project_by_shortcode($shortcode) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'image_map_pro_projects';
        $project = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE shortcode = %s", $shortcode));

        if ($project) {
          $project->json = stripslashes($project->json);
        }

        return $project;
      }

      // Editor functions
      function get_last_project_id() {
        $this->verify_nonce();
        $this->verify_capabilities();

        $options = $this->get_admin_options();
        echo esc_html($options['lastProjectID']);
        die();
      }
      function get_projects_list() {        
        $this->verify_nonce();
        $this->verify_capabilities();
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'image_map_pro_projects';
        $projects = $wpdb->get_results("SELECT * FROM $table_name ORDER BY name ASC");

        // strip slashes from each project's json
        foreach ($projects as $key => $value) {
          $projects[$key]->json = stripslashes($value->json);
        }

        $result = array();
        foreach ($projects as $key => $value) {
          $result[$key] = array(
            'name' => $value->name,
            'id' => $value->id,
            'lastSaved' => json_decode($value->json)->lastSaved
          );
        }

        $result = wp_json_encode($result);
        echo $result;

			  die();
      }
      function get_project() {
        $this->verify_nonce();
        $this->verify_capabilities();

        global $wpdb;
        $table_name = $wpdb->prefix . 'image_map_pro_projects';
        $project = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %s", sanitize_text_field($_POST['id'])));

        if ($project) {
          echo stripslashes($project->json);
        }

        die();
      }
      function save_project() {
        $this->verify_nonce();
        $this->verify_capabilities();

        // Additional capability check, because we are writing executable JS code in the database
        if (!current_user_can('unfiltered_html')) {
          die('You do not have permission to do this');
        }

        if (!isset($_POST['shortcode'])) {
          $_POST['shortcode'] = '';
        }
        if (!isset($_POST['name'])) {
          $_POST['name'] = 'Untitled';
        }
        if (!isset($_POST['json'])) {
          $_POST['json'] = '{}';
        }

        // Sanitize input
        $save_id = sanitize_text_field($_POST['saveID']);
        $name = sanitize_text_field($_POST['name']);
        $shortcode = sanitize_text_field($_POST['shortcode']);

        // Validate JSON: decode and re-encode to strip any malformed content
        $json_decoded = json_decode(wp_unslash($_POST['json']));
        if (json_last_error() !== JSON_ERROR_NONE) {
          die('Invalid JSON');
        }
        $json = wp_slash(wp_json_encode($json_decoded));

        // update project by id, or create if it doesnt exist
        global $wpdb;
        $table_name = $wpdb->prefix . 'image_map_pro_projects';
        $project = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %s", sanitize_text_field($_POST['saveID'])));

        if ($project) {
          $wpdb->update(
            $table_name,
            array(
              'name' => $name,
              'shortcode' => $shortcode,
              'json' => $json
            ),
            array('id' => $save_id),
            array('%s', '%s', '%s'),
            array('%s')
          );
        } else {
          $wpdb->insert(
            $table_name,
            array(
              'id' => $save_id,
              'name' => $name,
              'shortcode' => $shortcode,
              'json' => $json
            ),
            array('%s', '%s', '%s', '%s')
          );
        }

        // set last project id
        $options = $this->get_admin_options();
        $options['lastProjectID'] = $save_id;
        update_option($this->admin_options_name, $options);
        echo 1;

        die();
      }
      function delete_project() {
        $this->verify_nonce();
        $this->verify_capabilities();

        // delete project from db by id
        global $wpdb;
        $table_name = $wpdb->prefix . 'image_map_pro_projects';
        $wpdb->delete($table_name, array('id' => sanitize_text_field($_POST['saveID'])), array('%s'));
        die();
      }

      // Deprecated
      function load_project() {
        $this->verify_nonce();
        $this->verify_capabilities();

        // load project from db by id
        global $wpdb;
        $table_name = $wpdb->prefix . 'image_map_pro_projects';
        $project = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %s", sanitize_text_field($_POST['saveID'])));

        $json = stripslashes($project->json);

        // return
        echo $json;
        die();
      }
    }
  }
?>