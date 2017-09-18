(function (window) {
  'use strict'

  function Xiao (routes, defaultId, options) {
    options = options || {}
    this.settings = {
      showHide: true
    }

    for (var setting in options) {
      if (options.hasOwnProperty(setting)) {
        this.settings[setting] = options[setting]
      }
    }

    this.routes = routes
    this.defaultId = defaultId
    this.ids = routes.map((route) => route.id)
    this._listeners = {}
    this.paramString = null

    var elem = (id) => {
      return document.getElementById(id)
    }

    var routeById = (id) => {
      return this.routes.find(route => id === route.id)
    }

    var linksById = (id) => {
      return document.querySelectorAll('[href*="#' + id + '"]')
    }

    var routeExists = (route) => {
      return this.ids.find(id => id === route)
    }

    var idByURL = (string) => {
      return string.match(/#.*?(\?|$)/gi)[0].replace('?', '').substr(1)
    }

    var paramsByURL = (string) => {
      return string.match(/\?.*?(#|$)/gi)[0].replace('#', '').substr(1)
    }

    var parentRouteExists = (id) => {
      return this.ids.find(route => elem(route).contains(elem(id)))
    }

    var reconfigure = (newRoute, oldRoute, focusId) => {
      if (this.settings.showHide) {
        this.ids.forEach(function (id) {
          elem(id).hidden = true
        })
      }

      var newRegion = elem(newRoute)
      if (newRegion) {
        if (this.settings.showHide) {
          newRegion.hidden = false
        }
        elem(focusId).setAttribute('tabindex', '-1')
        elem(focusId).focus()
      }

      if (oldRoute && routeExists(oldRoute)) {
        if (routeById(oldRoute).departed) {
          routeById(oldRoute).departed(elem(oldRoute))
        }
      }

      var params
      if (window.location.href.includes('?')) {
        var query = paramsByURL(window.location.href)
        params = query !== 0 ? JSON.parse('{"' + decodeURI(query).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}') : null
      } else {
        params = null
      }

      if (routeById(newRoute).arrived) {
        routeById(newRoute).arrived(elem(newRoute), params)
      }

      if (newRoute !== oldRoute) {
        Array.prototype.forEach.call(linksById(newRoute), (link) => {
          link.setAttribute('aria-current', 'true')
        })
        Array.prototype.forEach.call(linksById(oldRoute), (link) => {
          link.removeAttribute('aria-current')
        })
      }

      document.title = this.title + ' ' + routeById(newRoute).label

      document.body.scrollTop = 0
    }

    window.addEventListener('load', (e) => {
      console.log('load!!')
      this.title = document.title

      this.routes.forEach(route => {
        var region = elem(route.id)
        region.setAttribute('role', 'region')
        region.setAttribute('aria-label', route.label)
      })

      var hash = window.location.hash.substr(1)

      if (hash === '' || !routeExists(hash)) {
        this.reroute(this.defaultId)
      } else {
        reconfigure(hash, null, hash)
      }
    })

    window.addEventListener('hashchange', (e) => {
      var id = idByURL(window.location.href)
      var newRoute = parentRouteExists(id)
      var oldId = e.oldURL.indexOf('#') > -1 ? idByURL(e.oldURL) : null
      var oldRoute = oldId ? parentRouteExists(oldId) : null

      if (newRoute) {
        var focusId = id === newRoute ? newRoute : id
        reconfigure(newRoute, oldRoute, focusId)
      }
    })
  }

  Xiao.prototype.reroute = function (id) {
    window.location.hash = id
    return this
  }

  window.Xiao = Xiao
}(this))
