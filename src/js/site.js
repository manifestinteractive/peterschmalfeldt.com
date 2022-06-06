(function () {
  const PS = {
    devFlags: {
      debug: (PS_ENV !== 'production'),
      sendContact: (PS_ENV !== 'development'),
      disableAnalytics: (PS_ENV === 'development')
    },
    interval: null,
    loaded: false,
    moveResetTimeout: false,
    timeout: null,

    /**
     * Bind Events to DOM Elements
     */
    bindEvents: function () {
      // Cache Element Lookups
      const $backToTop = $('#back-to-top')
      const $trackLinks = $('a[data-track], button[data-track]')
      const $trackInput = $('input[data-track], textarea[data-track], select[data-track]')
      const $menuTrigger = $('#menu-trigger')
      const $document = $(document)
      const $window = $(window)

      // Remove Current Event Listeners
      $backToTop.off('click.mi', PS.backToTop)
      $document.off('click.mi', PS.rexyBlink)
      $document.off('mousemove.mi', PS.moveEyes)
      $trackLinks.off('click.mi', PS.trackLinks)
      $trackInput.off('change.mi', PS.trackInput)
      $menuTrigger.off('click.mi', PS.menuTrigger)
      $window.off('scroll.mi', PS.scroll)

      // Add New Event Listeners
      $backToTop.on('click.mi', PS.backToTop)
      $document.on('click.mi', PS.rexyBlink)
      $document.on('mousemove.mi', PS.moveEyes)
      $trackLinks.on('click.mi', PS.trackLinks)
      $trackInput.on('change.mi', PS.trackInput)
      $menuTrigger.on('click.mi', PS.menuTrigger)
      $window.on('scroll.mi', PS.scroll)

      const overscroll = new Overscroll()
      overscroll.init('/assets/images/peter.png')

      setInterval(function () {
        const random = Math.floor(Math.random() * 2)
        if (random === 1) {
          PS.rexyBlink()
        }
      }, 10000)
    },

    /**
     * Track Event using Google Analytics
     * @param category
     * @param action
     * @param label
     * @param value
     */
    trackEvent: function (category, action, label, value) {
      if (typeof gtag !== 'undefined' && !PS.devFlags.disableAnalytics && window.gdprConcent) {
        gtag('event', action, {
          event_category: category,
          event_label: label,
          value: value
        })
      }

      if (PS.devFlags.debug) {
        console.log('Track Event:', category, action, label, value)
      }
    },

    /**
     * Setup Tracking on Links
     * @param evt
     */
    trackLinks: function (evt) {
      let data

      if (typeof evt.target !== 'undefined' && typeof evt.target.dataset !== 'undefined' && typeof evt.target.dataset.track !== 'undefined') {
        data = evt.target.dataset
      } else if (typeof evt.target !== 'undefined' && typeof evt.target.parentNode !== 'undefined' && typeof evt.target.parentNode.dataset !== 'undefined' && typeof evt.target.parentNode.dataset.track !== 'undefined') {
        data = evt.target.parentNode.dataset
      }

      if (typeof data === 'object' && typeof data.category === 'string' && typeof data.action === 'string' && typeof data.label === 'string') {
        PS.trackEvent(data.category, data.action, data.label, data.value)
      }
    },

    /**
     * Setup Tracking on Input
     * @param evt
     */
    trackInput: function (evt) {
      let data

      if (typeof evt.target !== 'undefined' && typeof evt.target.dataset !== 'undefined' && typeof evt.target.dataset.track !== 'undefined') {
        data = evt.target.dataset
      } else if (typeof evt.target !== 'undefined' && typeof evt.target.parentNode !== 'undefined' && typeof evt.target.parentNode.dataset !== 'undefined' && typeof evt.target.parentNode.dataset.track !== 'undefined') {
        data = evt.target.parentNode.dataset
      }

      if (typeof data === 'object' && typeof data.category === 'string' && typeof data.action === 'string') {
        PS.trackEvent(data.category, data.action, evt.target.value, evt.target.value.length)
      }
    },

    /**
     * Return to Top of Page
     * @param evt
     */
    backToTop: function (evt) {
      evt.preventDefault()
      window.scrollTo(0, 0)
    },

    /**
     * Initialize Website
     */
    init: function () {
      const $body = $('body')
      const loading = ($body.hasClass('loading'))

      if (loading) {
        PS.setupGUI()
      }
    },

    menuTrigger: function () {
      const $header = $('#header')
      const $mainMenu = $('#main-menu')
      const isOpen = $(this).hasClass('open')

      $header.toggleClass('display-menu')
      $mainMenu.toggleClass('display-menu')

      $(this).toggleClass('open')
      $(this).attr('aria-expanded', !isOpen)
    },

    moveEyes: function (e) {
      // Don't bother animating eye tracking if no one can see them
      if ($('#logo:hover').length !== 0 || !$('#logo').isInViewport() || window.innerWidth < 768) {
        if (PS.moveResetTimeout) {
          $('#logo-eyes, #left-eye, #right-eye').css('transform', 'translate(0, 0)').removeClass('moving')
          clearTimeout(PS.moveResetTimeout)
        }
        return
      }

      requestAnimationFrame(function () {
        const x = (-((window.innerWidth / 2) - e.pageX) / 160)
        const y = (-((window.innerHeight / 2) - e.pageY) / 160)

        $('#logo-eyes, #left-eye, #right-eye').addClass('moving').css('transform', `translate(${x}px, ${y}px)`)

        if (PS.moveResetTimeout) {
          clearTimeout(PS.moveResetTimeout)
        }

        PS.moveResetTimeout = setTimeout(function () {
          $('#logo-eyes, #left-eye, #right-eye').css('transform', 'translate(0, 0)').removeClass('moving')
        }, 3000)
      })
    },

    rexyBlink: function () {
      const $blink = $('.blink')
      $blink.toggleClass('hide')

      setTimeout(function () {
        $blink.toggleClass('hide')
      }, 125)
    },

    scroll: function () {
      const $backToTop = $('#back-to-top')

      if ($(window).scrollTop() > 300 && !$backToTop.hasClass('show')) {
        $backToTop.addClass('show')
      } else if ($(window).scrollTop() <= 300 && $backToTop.hasClass('show')) {
        $backToTop.removeClass('show')
      }
    },

    /**
     * Setup Graphic User Interface
     */
    setupGUI: function () {
      PS.bindEvents()
      PS.loaded = true

      // Add active class to menu
      const path = window.location.pathname
      $('#menu a').each(function () {
        const href = $(this).attr('href')
        if (href === path || (href === '/projects' && path.indexOf('project') > -1)) {
          $(this).addClass('active')
          $(this).attr('tabindex', -1)
        }
      })

      // Hide Page Loader after setting up everything
      $('body').removeClass('loading')

      clearInterval(PS.interval)
    }
  }

  /**
   * Initialize on Page Load
   */
  window.addEventListener('load', PS.init)

  /**
   * Fix iOS Back Button Issue for Loading Screen
   */
  window.addEventListener('pageshow', function (e) {
    if (event.originalEvent && event.originalEvent.persisted) {
      window.location.reload()
    }
  })

  /**
   * Remove Hover State for Touch Devices to Prevent Double Tap
   */
  if (typeof window.orientation !== 'undefined' && ('ontouchstart' in document.documentElement || window.navigator.maxTouchPoints > 0 || window.navigator.msMaxTouchPoints > 0)) {
    try {
      for (const si in document.styleSheets) {
        const styleSheet = document.styleSheets[si]
        if (!styleSheet.rules) {
          continue
        }

        for (let ri = styleSheet.rules.length - 1; ri >= 0; ri--) {
          if (!styleSheet.rules[ri].selectorText) {
            continue
          }

          if (styleSheet.rules[ri].selectorText.match(':hover')) {
            styleSheet.deleteRule(ri)
          }
        }
      }
    } catch (ex) {}
  }

  /**
   * Detect if user is using Internet Explorer
   */
  function detectIE () {
    const ua = window.navigator.userAgent

    const msie = ua.indexOf('MSIE ')
    if (msie > 0) {
      // IE 10 or older => return version number
      return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10)
    }

    const trident = ua.indexOf('Trident/')
    if (trident > 0) {
      // IE 11 => return version number
      const rv = ua.indexOf('rv:')
      return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10)
    }

    const edge = ua.indexOf('Edge/')
    if (edge > 0) {
      // Edge (IE 12+) => return version number
      return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10)
    }

    // other browser
    return false
  }

  /**
   * Custom Greetings for Nerds Like Me
   */
  (function () {
    if (typeof console !== 'undefined') {
      const email = $('<textarea />').html('&#109;&#101;&#064;&#112;&#101;&#116;&#101;&#114;&#115;&#099;&#104;&#109;&#097;&#108;&#102;&#101;&#108;&#100;&#116;&#046;&#099;&#111;&#109;').text()
      const title = 'CERTIFIED SENIOR SALESFORCE COMMERCE CLOUD DEVELOPER'
      const ascii = '\n╔═╗┌─┐┌┬┐┌─┐┬─┐  ╔═╗┌─┐┬ ┬┌┬┐┌─┐┬  ┌─┐┌─┐┬  ┌┬┐┌┬┐\n╠═╝├┤  │ ├┤ ├┬┘  ╚═╗│  ├─┤│││├─┤│  ├┤ ├┤ │   ││ │ \n╩  └─┘ ┴ └─┘┴└─  ╚═╝└─┘┴ ┴┴ ┴┴ ┴┴─┘└  └─┘┴─┘─┴┘ ┴ \n\n'
      const contact = `❯ EMAIL:\t${email}\n❯ GITHUB:\tmanifestinteractive\n❯ TWITTER:\tmrmidi`

      if (detectIE()) {
        console.log(ascii + '  ' + title + '\n\n' + contact + '\n ')
      } else {
        console.log('%c' + ascii + title + '\n\n%c' + contact + '\n ', 'font-family: monospace; color: #7fcab1', null)
      }
    }
  })()
})()
