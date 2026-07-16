(function () {
  const PS = {
    devFlags: {
      debug: (PS_ENV !== 'production'),
      sendContact: (PS_ENV !== 'development'),
      disableAnalytics: (PS_ENV === 'development')
    },
    interval: null,
    loaded: false,
    calendlyTrigger: null,
    moveResetTimeout: false,
    timeout: null,
    testimonialSlide: 1,
    testimonialTouchStartX: null,
    testimonialTouchStartY: null,

    /**
     * Bind Events to DOM Elements
     */
    bindEvents: function () {
      // Cache Element Lookups
      const $backToTop = $('#back-to-top')
      const $trackLinks = $('a[data-track], button[data-track]')
      const $trackInput = $('input[data-track], textarea[data-track], select[data-track]')
      const $menuTrigger = $('#menu-trigger')
      const $menuAnchors = $('#menu a[href^="#"]')
      const $calendlyOpen = $('.js-calendly-open')
      const $calendlyClose = $('[data-calendly-close]')
      const $calendlyModal = $('#calendly-modal')
      const $testimonialContent = $('#testimonials .cont')
      const $testimonialDots = $('#testimonials .dot')
      const $leftArrow = $('#left-arrow')
      const $rightArrow = $('#right-arrow')
      const $window = $(window)

      // Remove Current Event Listeners
      $backToTop.off('click.ps', PS.backToTop)
      $trackLinks.off('click.ps', PS.trackLinks)
      $trackInput.off('change.ps', PS.trackInput)
      $menuTrigger.off('click.ps', PS.menuTrigger)
      $menuAnchors.off('click.ps', PS.closeMenu)
      $calendlyOpen.off('click.ps', PS.openCalendly)
      $calendlyClose.off('click.ps', PS.closeCalendly)
      $calendlyModal.off('keydown.ps', PS.calendlyKeydown)
      $(document).off('focusin.psCalendly', PS.calendlyFocusin)
      $testimonialContent.off('touchstart.ps', PS.testimonialTouchStart)
      $testimonialContent.off('touchend.ps', PS.testimonialTouchEnd)
      $testimonialContent.off('touchcancel.ps', PS.testimonialTouchCancel)
      $testimonialDots.off('click.ps', PS.testimonialDots)
      $leftArrow.off('click.ps', PS.testimonialPrev)
      $rightArrow.off('click.ps', PS.testimonialNext)
      $window.off('scroll.ps', PS.scroll)

      // Add New Event Listeners
      $backToTop.on('click.ps', PS.backToTop)
      $trackLinks.on('click.ps', PS.trackLinks)
      $trackInput.on('change.ps', PS.trackInput)
      $menuTrigger.on('click.ps', PS.menuTrigger)
      $menuAnchors.on('click.ps', PS.closeMenu)
      $calendlyOpen.on('click.ps', PS.openCalendly)
      $calendlyClose.on('click.ps', PS.closeCalendly)
      $calendlyModal.on('keydown.ps', PS.calendlyKeydown)
      $(document).on('focusin.psCalendly', PS.calendlyFocusin)
      $testimonialContent.on('touchstart.ps', PS.testimonialTouchStart)
      $testimonialContent.on('touchend.ps', PS.testimonialTouchEnd)
      $testimonialContent.on('touchcancel.ps', PS.testimonialTouchCancel)
      $testimonialDots.on('click.ps', PS.testimonialDots)
      $leftArrow.on('click.ps', PS.testimonialPrev)
      $rightArrow.on('click.ps', PS.testimonialNext)
      $window.on('scroll.ps', PS.scroll)
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
      PS.setupGUI()
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

    closeMenu: function () {
      const $menuTrigger = $('#menu-trigger')

      if ($(window).width() <= 767 && !$menuTrigger.hasClass('closed')) {
        PS.menuTrigger.call($menuTrigger[0])
      }
    },

    openCalendly: function (evt) {
      evt.preventDefault()

      const $modal = $('#calendly-modal')
      const $frame = $('#calendly-frame')
      PS.calendlyTrigger = document.activeElement

      if ($frame.attr('src') === 'about:blank') {
        $frame.attr('src', $frame.data('src'))
      }

      $modal.removeAttr('hidden')
      $('body').addClass('calendly-modal-open')
      $modal.find('.calendly-modal-close').trigger('focus')
      $('#page-wrapper, #calendly-trigger, #back-to-top').attr('inert', '')
    },

    closeCalendly: function (evt) {
      if (evt) {
        evt.preventDefault()
      }

      $('#calendly-modal').attr('hidden', true)
      $('body').removeClass('calendly-modal-open')
      $('#page-wrapper, #calendly-trigger, #back-to-top').removeAttr('inert')

      if (PS.calendlyTrigger && typeof PS.calendlyTrigger.focus === 'function') {
        PS.calendlyTrigger.focus()
      }
    },

    calendlyKeydown: function (evt) {
      if (evt.key === 'Escape') {
        PS.closeCalendly(evt)
        return
      }

      if (evt.key !== 'Tab') {
        return
      }

      const $focusable = $('#calendly-modal').find('button, a[href], iframe, [tabindex]:not([tabindex="-1"])').filter(':visible')
      const first = $focusable[0]
      const last = $focusable[$focusable.length - 1]

      if (evt.shiftKey && document.activeElement === first) {
        evt.preventDefault()
        last.focus()
      } else if (!evt.shiftKey && document.activeElement === last) {
        evt.preventDefault()
        first.focus()
      }
    },

    calendlyFocusin: function (evt) {
      const modal = document.getElementById('calendly-modal')

      if (modal && !modal.hasAttribute('hidden') && !modal.contains(evt.target)) {
        const close = modal.querySelector('.calendly-modal-close')
        close.focus()
      }
    },

    setupStats: function () {
      const stats = document.querySelectorAll('.stat-number[data-count]')
      const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

      if (!stats.length || reduceMotion || typeof window.IntersectionObserver === 'undefined') {
        return
      }

      const observer = new window.IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            PS.animateStat(entry.target)
            observer.unobserve(entry.target)
          }
        })
      }, {
        threshold: 0.25
      })

      stats.forEach(function (stat) {
        observer.observe(stat)
      })
    },

    animateStat: function (stat) {
      if (stat.dataset.animated === 'true') {
        return
      }

      const target = parseInt(stat.dataset.count, 10)
      const prefix = stat.dataset.prefix || ''
      const suffix = stat.dataset.suffix || ''
      const duration = 1400
      const start = window.performance.now()
      let current = -1

      stat.dataset.animated = 'true'
      stat.textContent = `${prefix}0${suffix}`

      const update = function (now) {
        const progress = Math.min((now - start) / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        const next = Math.floor(target * eased)

        if (next !== current) {
          stat.textContent = `${prefix}${next}${suffix}`
          current = next
        }

        if (progress < 1) {
          window.requestAnimationFrame(update)
        } else {
          stat.textContent = `${prefix}${target}${suffix}`
        }
      }

      window.requestAnimationFrame(update)
    },

    testimonialNext: function (evt) {
      if (evt) {
        evt.preventDefault()
      }
      let slide = parseInt(PS.testimonialSlide, 10) + 1
      if (slide > $('#testimonials .slide').length) {
        slide = 1
      }
      PS.showTestimonial(slide)
    },

    testimonialPrev: function (evt) {
      if (evt) {
        evt.preventDefault()
      }
      let slide = parseInt(PS.testimonialSlide, 10) - 1
      if (slide < 1) {
        slide = $('#testimonials .slide').length
      }
      PS.showTestimonial(slide)
    },

    testimonialDots: function (evt) {
      const slide = parseInt(evt.currentTarget.dataset.slide, 10)
      PS.showTestimonial(slide)
    },

    showTestimonial: function (slide) {
      const $slides = $('#testimonials .slide')
      const $dots = $('#testimonials .dot')
      const $activeSlide = $(`#testimonials .slide-${slide}`)
      const $activeDot = $(`#testimonials .dot-${slide}`)

      $slides.removeClass('active').addClass('inactive').attr('aria-hidden', 'true')
      $dots.removeClass('active').addClass('inactive').removeAttr('aria-current')
      $activeSlide.addClass('active').removeClass('inactive').removeAttr('aria-hidden')
      $activeDot.addClass('active').removeClass('inactive').attr('aria-current', 'true')
      PS.testimonialSlide = slide
    },

    testimonialTouchStart: function (evt) {
      const touches = evt.originalEvent.touches

      if (!touches || touches.length !== 1) {
        PS.testimonialTouchCancel()
        return
      }

      PS.testimonialTouchStartX = touches[0].clientX
      PS.testimonialTouchStartY = touches[0].clientY
    },

    testimonialTouchEnd: function (evt) {
      const touches = evt.originalEvent.changedTouches

      if (!touches || !touches.length || PS.testimonialTouchStartX === null || PS.testimonialTouchStartY === null) {
        PS.testimonialTouchCancel()
        return
      }

      const deltaX = touches[0].clientX - PS.testimonialTouchStartX
      const deltaY = touches[0].clientY - PS.testimonialTouchStartY
      const horizontalDistance = Math.abs(deltaX)
      const verticalDistance = Math.abs(deltaY)

      PS.testimonialTouchCancel()

      if (horizontalDistance < 50 || horizontalDistance <= verticalDistance * 1.2) {
        return
      }

      if (deltaX < 0) {
        PS.testimonialNext()
      } else {
        PS.testimonialPrev()
      }
    },

    testimonialTouchCancel: function () {
      PS.testimonialTouchStartX = null
      PS.testimonialTouchStartY = null
    },

    scroll: function () {
      const $backToTop = $('#back-to-top')
      const $calendly = $('#calendly-trigger')

      if ($(window).scrollTop() > 300 && $backToTop.hasClass('hidden')) {
        $backToTop.removeClass('hidden')
        $calendly.addClass('shifted')
      } else if ($(window).scrollTop() <= 300 && !$backToTop.hasClass('hidden')) {
        $backToTop.addClass('hidden')
        $calendly.removeClass('shifted')
      }
    },

    /**
     * Setup Graphic User Interface
     */
    setupGUI: function () {
      PS.bindEvents()
      PS.setupStats()
      PS.loaded = true
      document.documentElement.classList.add('site-ready')

      // Add active class to menu
      const path = window.location.pathname
      $('#menu a').each(function () {
        const href = $(this).attr('href')
        if (href === path || (href === '/projects' && path.indexOf('project') > -1)) {
          $(this).addClass('active')
          $(this).attr('tabindex', -1)
        }
      })

      clearInterval(PS.interval)
    }
  }

  /**
   * Initialize on Page Load
   */
  document.addEventListener('DOMContentLoaded', PS.init)

  /**
   * Refresh stale state when restoring from the browser's back-forward cache
   */
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) {
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
      const title = 'Senior Full-Stack & AI Engineer | Solutions Architect'
      const ascii = '\n╔═╗┌─┐┌┬┐┌─┐┬─┐  ╔═╗┌─┐┬ ┬┌┬┐┌─┐┬  ┌─┐┌─┐┬  ┌┬┐┌┬┐\n╠═╝├┤  │ ├┤ ├┬┘  ╚═╗│  ├─┤│││├─┤│  ├┤ ├┤ │   ││ │ \n╩  └─┘ ┴ └─┘┴└─  ╚═╝└─┘┴ ┴┴ ┴┴ ┴┴─┘└  └─┘┴─┘─┴┘ ┴ \n\n'
      const contact = `❯ EMAIL:\t${email}\n❯ GITHUB:\thttps://github.com/manifestinteractive\n❯ LINKEDIN:\thttps://www.linkedin.com/in/peter-schmalfeldt`
      const work = 'WANT TO TALK THROUGH AN IDEA?\n\nTell me what you are working on and where another experienced person could help.'

      if (detectIE()) {
        console.log(ascii + '  ' + title + '\n\n' + contact + '\n\n' + work + '\n ')
      } else {
        console.log('%c' + ascii + title + '\n\n%c' + contact + '\n\n' + work + '\n ', 'font-family: monospace; color: #566aae', null)
      }
    }
  })()

  if (PS_ENV === 'production' && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
  }
})()
