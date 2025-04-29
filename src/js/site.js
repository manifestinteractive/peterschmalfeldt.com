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
    testimonialSlide: 1,

    /**
     * Bind Events to DOM Elements
     */
    bindEvents: function () {
      // Cache Element Lookups
      const $backToTop = $('#back-to-top')
      const $trackLinks = $('a[data-track], button[data-track]')
      const $trackInput = $('input[data-track], textarea[data-track], select[data-track]')
      const $menuTrigger = $('#menu-trigger')
      const $testimonialDots = $('#testimonials .dot')
      const $leftArrow = $('#left-arrow')
      const $rightArrow = $('#right-arrow')
      const $window = $(window)

      // Remove Current Event Listeners
      $backToTop.off('click.ps', PS.backToTop)
      $trackLinks.off('click.ps', PS.trackLinks)
      $trackInput.off('change.ps', PS.trackInput)
      $menuTrigger.off('click.ps', PS.menuTrigger)
      $leftArrow.off('click.ps', PS.testimonialPrev)
      $rightArrow.off('click.ps', PS.testimonialNext)
      $testimonialDots.off('click.ps', PS.testimonialDots)
      $window.off('scroll.ps', PS.scroll)

      // Add New Event Listeners
      $backToTop.on('click.ps', PS.backToTop)
      $trackLinks.on('click.ps', PS.trackLinks)
      $trackInput.on('change.ps', PS.trackInput)
      $menuTrigger.on('click.ps', PS.menuTrigger)
      $leftArrow.on('click.ps', PS.testimonialPrev)
      $rightArrow.on('click.ps', PS.testimonialNext)
      $testimonialDots.on('click.ps', PS.testimonialDots)
      $window.on('scroll.ps', PS.scroll)

      const overscroll = new Overscroll()
      overscroll.init('/assets/images/peter.png')
    },

    /**
     * Track Event using Google Analytics
     * @param category
     * @param action
     * @param label
     * @param value
     */
    trackEvent: function (category, action, label, value) {
      if (typeof gtag !== 'undefined' && !PS.devFlags.disableAnalytics) {
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
      const isOpen = !$(this).hasClass('closed')

      $header.toggleClass('hide-menu')
      $mainMenu.toggleClass('hide-menu')

      $(this).toggleClass('closed')
      $(this).attr('aria-expanded', !isOpen)
    },

    testimonialNext: function (evt) {
      let slide = PS.testimonialSlide + 1
      if (slide > $('#testimonials .slide').length) {
        slide = 1
      }
      $('#testimonials .slide, #testimonials .dot').removeClass('active').addClass('inactive')
      $(`#testimonials .slide-${slide}, #testimonials .dot-${slide}`).addClass('active').removeClass('inactive')
      PS.testimonialSlide = slide
    },

    testimonialPrev: function () {
      let slide = PS.testimonialSlide - 1
      if (slide < 1) {
        slide = $('#testimonials .slide').length
      }
      $('#testimonials .slide, #testimonials .dot').removeClass('active').addClass('inactive')
      $(`#testimonials .slide-${slide}, #testimonials .dot-${slide}`).addClass('active').removeClass('inactive')
      PS.testimonialSlide = slide
    },

    testimonialDots: function (evt) {
      const slide = evt.target.dataset.slide
      $('#testimonials .slide, #testimonials .dot').removeClass('active').addClass('inactive')
      $(`#testimonials .slide-${slide}, #testimonials .dot-${slide}`).addClass('active').removeClass('inactive')
      PS.testimonialSlide = slide
    },

    scroll: function () {
      const $backToTop = $('#back-to-top')

      if ($(window).scrollTop() > 300 && $backToTop.hasClass('hidden')) {
        $backToTop.removeClass('hidden')
      } else if ($(window).scrollTop() <= 300 && !$backToTop.hasClass('hidden')) {
        $backToTop.addClass('hidden')
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
      const title = 'Senior Full-Stack Web Developer'
      const ascii = '\n╔═╗┌─┐┌┬┐┌─┐┬─┐  ╔═╗┌─┐┬ ┬┌┬┐┌─┐┬  ┌─┐┌─┐┬  ┌┬┐┌┬┐\n╠═╝├┤  │ ├┤ ├┬┘  ╚═╗│  ├─┤│││├─┤│  ├┤ ├┤ │   ││ │ \n╩  └─┘ ┴ └─┘┴└─  ╚═╝└─┘┴ ┴┴ ┴┴ ┴┴─┘└  └─┘┴─┘─┴┘ ┴ \n\n'
      const contact = `❯ EMAIL:\t${email}\n❯ GITHUB:\thttps://github.com/manifestinteractive\n❯ LINKEDIN:\thttps://www.linkedin.com/in/peter-schmalfeldt`
      const work = 'I AM OPEN TO DISCUSS THE FOLLOWING PROJECTS:\n\n1. Contract-based\n2. Fully Remote\n3. Part-time (max 20 hrs/wk)\n4. Flexible Scheduling\n5. Not a competitor to Patagonia.com'

      if (detectIE()) {
        console.log(ascii + '  ' + title + '\n\n' + contact + '\n\n' + work + '\n ')
      } else {
        console.log('%c' + ascii + title + '\n\n%c' + contact + '\n\n' + work + '\n ', 'font-family: monospace; color: #7fcab1', null)
      }
    }
  })()

  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    const listenForWaitingServiceWorker = (reg, callback = () => {}) => {
      function awaitStateChange () {
        reg.installing.addEventListener('statechange', function () {
          if (this.state === 'installed') callback(reg)
        })
      }
      if (!reg) return
      if (reg.waiting) return callback(reg)
      if (reg.installing) awaitStateChange()
      reg.addEventListener('updatefound', awaitStateChange)
    }

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        listenForWaitingServiceWorker(registration)

        registration.onupdatefound = () => {
          const installingWorker = registration.installing
          if (installingWorker == null) {
            return
          }
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log(
                  'New content is available and will be used when all tabs for this page are closed.'
                )
                if (confirm('WEBSITE UPDATE:\n\nMy website has changed since the last time you were here. Would you like to reload the page to see the latest?')) {
                  window.location.reload(true)
                }
              } else {
                console.log('Content is cached for offline use.')
              }
            }
          }
        }
      })
      .catch((error) => {
        console.error('Error during service worker registration:', error)
      })
  }
})()
