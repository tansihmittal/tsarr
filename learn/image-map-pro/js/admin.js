;(() => {
  const iframe = document.createElement('iframe')

  document.querySelector('#button-launch-editor').addEventListener('click', launchEditor)

  window.addEventListener('message', async (e) => {
    const data = JSON.parse(e.data)

    if (data.action === 'getLastProjectId') {
      const id = await getLastProjectId()
      iframe.contentWindow.postMessage(
        JSON.stringify({
          action: 'getLastProjectId',
          id,
        }),
        '*',
      )
    }
    if (data.action === 'getProjectsList') {
      const projectsList = await getProjectsList()
      iframe.contentWindow.postMessage(
        JSON.stringify({
          action: 'getProjectsList',
          projectsList,
        }),
        '*',
      )
    }
    if (data.action === 'getProject') {
      const project = await getProject(data.id)
      iframe.contentWindow.postMessage(
        JSON.stringify({
          action: 'getProject',
          project,
        }),
        '*',
      )
    }
    if (data.action === 'saveProject') {
      const result = await saveProject({ name: data.name, json: data.json, saveID: data.id, shortcode: data.shortcode })

      if (result === true) {
        iframe.contentWindow.postMessage(
          JSON.stringify({
            action: 'saveProject',
            result: 'success',
          }),
          '*',
        )
      } else {
        iframe.contentWindow.postMessage(
          JSON.stringify({
            action: 'saveProject',
            result: 'error',
          }),
          '*',
        )
      }
    }
    if (data.action === 'deleteProject') {
      const result = await deleteProject(data.id)

      if (result === true) {
        iframe.contentWindow.postMessage(
          JSON.stringify({
            action: 'deleteProject',
            result: 'success',
          }),
          '*',
        )
      } else {
        iframe.contentWindow.postMessage(
          JSON.stringify({
            action: 'deleteProject',
            result: 'error',
          }),
          '*',
        )
      }
    }

    // Deprecated
    if (data.action === 'getLastSave') {
      const lastSavedMapId = await getLastProjectId()
      const map = (await loadProject(lastSavedMapId)) || false

      iframe.contentWindow.postMessage(
        JSON.stringify({
          action: 'getLastSave',
          map,
        }),
        '*',
      )
    }

    if (data.action === 'getSaves') {
      const maps = await loadProjects()

      iframe.contentWindow.postMessage(
        JSON.stringify({
          action: 'getSaves',
          maps,
        }),
        '*',
      )
    }

    if (data.action === 'save') {
      const result = await saveProject({ json: data.json, saveID: data.id, name: data.name, shortcode: data.shortcode })

      if (result === true) {
        iframe.contentWindow.postMessage(
          JSON.stringify({
            action: 'save',
            result: 'success',
          }),
          '*',
        )
      } else {
        iframe.contentWindow.postMessage(
          JSON.stringify({
            action: 'save',
            result: 'error',
          }),
          '*',
        )
      }
    }

    if (data.action === 'deleteSave') {
      const result = await deleteProject(data.id)

      if (result === true) {
        iframe.contentWindow.postMessage(
          JSON.stringify({
            action: 'deleteSave',
            result: 'success',
          }),
          '*',
        )
      } else {
        iframe.contentWindow.postMessage(
          JSON.stringify({
            action: 'deleteSave',
            result: 'error',
          }),
          '*',
        )
      }
    }

    if (data.action === 'uploadImage') {
      const url = await launchMediaLibrary()

      iframe.contentWindow.postMessage(
        JSON.stringify({
          action: 'uploadImage',
          url,
        }),
        '*',
      )
    }
  })

  async function launchEditor() {
    const editorScriptUrl = await getEditorScriptUrl()

    const container = document.createElement('div')
    container.setAttribute('id', 'image-map-pro-iframe-container')

    container.addEventListener('click', (e) => {
      if (e.target.getAttribute('id') === 'image-map-pro-iframe-container') {
        closeEditor()
      }
    })

    const closeButton = document.createElement('div')
    closeButton.setAttribute('id', 'image-map-pro-iframe-close-button')
    closeButton.innerHTML = '<span class="dashicons dashicons-no"></span>'
    closeButton.addEventListener('click', () => {
      closeEditor()
    })

    container.appendChild(closeButton)

    iframe.setAttribute('id', 'image-map-pro-iframe')
    const html = `
      <body style="padding: 0; margin: 0;">
        <div id="image-map-pro-editor" style="width: 100%; height: 100%;"></div>
        <script src="${editorScriptUrl}"></script>
      </body>`

    document.body.appendChild(container)
    container.appendChild(iframe)
    if (iframe.contentWindow.imageMapProConfig === undefined) iframe.contentWindow.imageMapProConfig = {}
    iframe.contentWindow.imageMapProConfig.wp = true
    iframe.contentWindow.document.open()
    iframe.contentWindow.document.write(html)
    iframe.contentWindow.document.close()
  }
  function closeEditor() {
    const container = document.querySelector('#image-map-pro-iframe-container')
    container.remove()
  }
  function getEditorScriptUrl() {
    return new Promise((resolve, reject) => {
      var data = {
        action: 'image_map_pro_get_editor_script_url',
        nonce: image_map_pro_locals.nonce,
      }

      jQuery.post(ajaxurl, data).done(function (res) {
        resolve(res)
      })
    })
  }
  function launchMediaLibrary() {
    // configuration of the media manager new instance
    return new Promise((resolve, reject) => {
      wp.media.frames.gk_frame = wp.media({
        title: 'Select Media',
        multiple: false,
        library: {
          type: 'image',
        },
        button: {
          text: 'Use Selected Media',
        },
      })

      // Function used for the image selection and media manager closing
      var gk_media_set_image = function () {
        var selection = wp.media.frames.gk_frame.state().get('selection')

        // no selection
        if (!selection) {
          resolve('')
        }

        // iterate through selected elements
        selection.each(function (attachment) {
          resolve(attachment.attributes.url)
        })
      }

      // closing event for media manger
      wp.media.frames.gk_frame.on('close', gk_media_set_image)
      // image selection event
      wp.media.frames.gk_frame.on('select', gk_media_set_image)
      // showing media manager
      wp.media.frames.gk_frame.open()
    })
  }
  function getLastProjectId() {
    return new Promise((resolve, reject) => {
      var data = {
        action: 'image_map_pro_get_last_project_id',
        nonce: image_map_pro_locals.nonce,
      }

      jQuery.post(ajaxurl, data).done(function (res) {
        resolve(res)
      })
    })
  }
  function getProjectsList() {
    return new Promise((resolve, reject) => {
      var data = {
        action: 'image_map_pro_get_projects_list',
        nonce: image_map_pro_locals.nonce,
      }

      jQuery.post(ajaxurl, data).done(function (res) {
        try {
          const parsed = JSON.parse(res)
          resolve(parsed)
        } catch (err) {
          console.error(err)
          resolve([])
        }
      })
    })
  }
  function getProject(id) {
    return new Promise((resolve, reject) => {
      var data = {
        action: 'image_map_pro_get_project',
        nonce: image_map_pro_locals.nonce,
        id,
      }

      jQuery.post(ajaxurl, data).done(function (res) {
        try {
          const parsed = JSON.parse(res)
          resolve(parsed)
        } catch (err) {
          console.warn(`Could not load project with id ${id}. Does the project exist?`)
          resolve(false)
        }
      })
    })
  }
  function saveProject({ name, json, saveID, shortcode }) {
    // if shortcode already exists, but it contains [], remove them
    if (shortcode && shortcode.includes('[') && shortcode.includes(']')) {
      shortcode = shortcode.replace('[', '').replace(']', '')
    }

    // if map name is empty, create a new one with the current date and time
    if (!name || name.trim() === '') {
      const date = new Date()
      name = `Image Map ${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
    }

    // if shortcode is empty, create a new one from the name
    if (!shortcode || shortcode.trim() === '') {
      shortcode = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    }

    const parsed = JSON.parse(json)
    parsed.general.shortcode = shortcode
    parsed.general.name = name
    json = JSON.stringify(parsed)

    return new Promise((resolve, reject) => {
      var data = {
        action: 'image_map_pro_save_project',
        nonce: image_map_pro_locals.nonce,
        name,
        json,
        saveID,
        shortcode,
      }

      jQuery.post(ajaxurl, data).done(function (res) {
        if (res) resolve(true)
        else resolve(false)
      })
    })
  }
  function deleteProject(id) {
    return new Promise((resolve, reject) => {
      var data = {
        action: 'image_map_pro_delete_project',
        nonce: image_map_pro_locals.nonce,
        saveID: id,
      }

      jQuery.post(ajaxurl, data).done(function (res) {
        resolve(true)
      })
    })
  }

  // Deprecated
  function _getLastProjectId() {
    return new Promise((resolve, reject) => {
      var data = {
        action: 'image_map_pro_get_last_project_id',
        nonce: image_map_pro_locals.nonce,
      }

      jQuery.post(ajaxurl, data).done(function (res) {
        resolve(res)
      })
    })
  }
  function _loadProjects() {
    return new Promise((resolve, reject) => {
      var data = {
        action: 'image_map_pro_load_projects',
        nonce: image_map_pro_locals.nonce,
      }

      jQuery.post(ajaxurl, data).done(function (res) {
        try {
          const parsed = JSON.parse(res)
          let arr = []
          parsed.forEach((element) => {
            arr.push(JSON.parse(element.json))
          })

          resolve(arr)
        } catch (err) {
          console.log(err)
          resolve([])
        }
      })
    })
  }
  function _saveProject({ name, json, saveID, shortcode }) {
    return new Promise((resolve, reject) => {
      var data = {
        action: 'image_map_pro_save_project',
        nonce: image_map_pro_locals.nonce,
        name,
        json,
        saveID,
        shortcode,
      }

      jQuery.post(ajaxurl, data).done(function (res) {
        console.log(res)
        if (res) resolve(true)
        else resolve(false)
      })
    })
  }
  function _loadProject(saveID) {
    return new Promise((resolve, reject) => {
      var data = {
        action: 'image_map_pro_load_project',
        nonce: image_map_pro_locals.nonce,
        saveID,
      }

      jQuery.post(ajaxurl, data).done(function (res) {
        try {
          res = JSON.parse(res)
          resolve(res)
        } catch (e) {
          console.log(e)
          resolve(false)
        }
      })
    })
  }
  function _deleteProject(saveID) {
    return new Promise((resolve, reject) => {
      var data = {
        action: 'image_map_pro_delete_project',
        nonce: image_map_pro_locals.nonce,
        saveID,
      }

      jQuery.post(ajaxurl, data).done(function (res) {
        resolve(res)
      })
    })
  }
})()
