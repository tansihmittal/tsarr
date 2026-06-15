; (function ($, window, document, undefined) {
  var el = wp.element.createElement
  var registerBlockType = wp.blocks.registerBlockType
  var SelectControl = wp.components.SelectControl

  registerBlockType('image-map-pro/image-map-pro', {
    title: 'Image Map Pro',
    category: 'widgets',
    attributes: {
      shortcode: {
        type: 'string'
      },
      saves: {
        type: 'text'
      },
      didLoadSaves: {
        type: 'bool',
        default: false
      },
      nonce: {
        type: 'string',
        default: null
      }
    },
    edit: function (props) {
      var data = {
        action: 'image_map_pro_load_projects_only_name_and_shortcode',
        nonce: image_map_pro_locals.nonce
      }

      $.post(ajaxurl, data).done(function (res) {
        try {
          const parsed = JSON.parse(res)
          var saves = []
          for (var i = 0; i < parsed.length; i++) {
            saves.push({
              value: '[' + parsed[i].shortcode + ']',
              label: parsed[i].name
            })
          }

          // Check if shortcode exists in the new save list
          var exists = false
          for (var i = 0; i < parsed.length; i++) {
            if ('[' + parsed[i].shortcode + ']' == props.attributes.shortcode) {
              exists = true
              break
            }
          }
          var attr = {}

          // If shortcode isn't set, or an image map with this shortcode doesn't exist,
          // then use the first save's shortcode
          if (!exists || !props.attributes.shortcode) {
            // console.log('store shortcode')
            attr.shortcode = saves[0].value
          }

          // If loaded saves are different that the current saves, add them to the object for update
          if (JSON.stringify(props.attributes.saves) !== JSON.stringify(saves)) {
            // console.log('store saves')
            attr.saves = saves
          }

          if (attr.saves || attr.shortcode) {
            props.setAttributes(attr)
          }
        } catch (err) {
          res = stripSlashes(res)
          res = res.replace(/\\'/g, "'")
        }
      })

      return el(
        SelectControl,
        {
          label: 'Select an Image Map',
          value: props.attributes.shortcode,
          options: props.attributes.saves,
          onChange: function (v) {
            props.setAttributes({ shortcode: v })
          }
        }
      )
    },
    save: function (props) {
      return el('div', {}, props.attributes.shortcode)
    }
  })

  function stripSlashes(str) {
    return str.replace(/\\(.)/mg, '$1')
  }
})(jQuery, window, document);
