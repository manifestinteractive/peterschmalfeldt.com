/* eslint-env node */

const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright-core')

const baseUrl = process.env.A11Y_BASE_URL || 'http://localhost:8081'
const screenshotDir = process.env.A11Y_SCREENSHOT_DIR
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8')
const scenarios = [
  {
    name: 'desktop light',
    viewport: { width: 1440, height: 1000 },
    colorScheme: 'light'
  },
  {
    name: 'desktop dark',
    viewport: { width: 1440, height: 1000 },
    colorScheme: 'dark'
  },
  {
    name: 'mobile light',
    viewport: { width: 375, height: 812 },
    colorScheme: 'light'
  }
]

const failures = []
const manualReviews = []

function addFailure (scope, rule, target, message) {
  failures.push({ scope, rule, target, message })
}

function printResult (label, status) {
  process.stdout.write(`${status === 'pass' ? 'PASS' : 'FAIL'} ${label}\n`)
}

async function loadLazyContent (page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight)
  const viewport = page.viewportSize()

  for (let position = 0; position < height; position += viewport.height) {
    await page.evaluate(scrollTop => window.scrollTo(0, scrollTop), position)
    await page.waitForTimeout(50)
  }

  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(150)
}

async function runAxe (page, scenario) {
  await page.addScriptTag({ content: axeSource })
  const results = await page.evaluate(async () => window.axe.run(document, {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
    },
    resultTypes: ['violations', 'incomplete']
  }))

  results.violations.forEach(violation => {
    violation.nodes.forEach(node => {
      addFailure(
        scenario.name,
        `axe:${violation.id}`,
        node.target.join(' '),
        node.failureSummary || violation.help
      )
    })
  })

  results.incomplete.forEach(result => {
    result.nodes.forEach(node => {
      manualReviews.push({
        scope: scenario.name,
        rule: `axe:${result.id}`,
        target: node.target.join(' '),
        message: result.help
      })
    })
  })

  printResult(
    `${scenario.name}: Axe WCAG scan`,
    results.violations.length === 0 ? 'pass' : 'fail'
  )
}

async function runSemanticChecks (page) {
  const results = await page.evaluate(() => {
    const describe = element => {
      if (element.id) return `#${element.id}`
      const classes = Array.from(element.classList).slice(0, 3).join('.')
      return `${element.tagName.toLowerCase()}${classes ? `.${classes}` : ''}`
    }

    const missingReferences = []
    document.querySelectorAll('[aria-labelledby], [aria-describedby]').forEach(element => {
      ;['aria-labelledby', 'aria-describedby'].forEach(attribute => {
        const value = element.getAttribute(attribute)
        if (!value) return
        value.split(/\s+/).forEach(id => {
          if (!document.getElementById(id)) {
            missingReferences.push({
              target: describe(element),
              attribute,
              id
            })
          }
        })
      })
    })

    return {
      missingReferences,
      buttonWrappers: Array.from(document.querySelectorAll('span.button > a')).map(describe),
      nonNativeArrows: Array.from(document.querySelectorAll('#testimonials .arrow')).filter(element => element.tagName !== 'BUTTON').map(describe),
      inaccessibleDots: Array.from(document.querySelectorAll('#testimonials .dot')).filter(element => {
        const control = element.matches('button, a[href], input') ? element : element.querySelector('button, a[href], input')
        if (!control) return true
        const label = control.getAttribute('aria-label') || control.textContent.trim()
        return !label
      }).map(describe),
      exposedSlides: Array.from(document.querySelectorAll('#testimonials .slide:not(.active)')).filter(element => {
        const style = getComputedStyle(element)
        return !element.hidden && element.getAttribute('aria-hidden') !== 'true' && style.display !== 'none' && style.visibility !== 'hidden'
      }).map(describe),
      skipLinkRole: document.querySelector('.skip-to-content-link')?.getAttribute('role') || null,
      landmarksInMain: Array.from(document.querySelectorAll('main header, main footer')).map(describe)
    }
  })

  results.missingReferences.forEach(result => {
    addFailure('semantics', 'missing-aria-reference', result.target, `${result.attribute} references missing #${result.id}`)
  })
  results.buttonWrappers.forEach(target => {
    addFailure('semantics', 'button-wrapper', target, 'Move the button class from the wrapper span to the link')
  })
  results.nonNativeArrows.forEach(target => {
    addFailure('semantics', 'non-native-carousel-control', target, 'Use a native button for the testimonial arrow')
  })
  results.inaccessibleDots.forEach(target => {
    addFailure('semantics', 'inaccessible-carousel-pagination', target, 'Use a named, keyboard-accessible control for the testimonial dot')
  })
  results.exposedSlides.forEach(target => {
    addFailure('semantics', 'exposed-inactive-slide', target, 'Hide inactive testimonial content from assistive technology')
  })
  if (results.skipLinkRole === 'button') {
    addFailure('semantics', 'skip-link-role', '.skip-to-content-link', 'A skip link must retain native link semantics')
  }
  results.landmarksInMain.forEach(target => {
    addFailure('semantics', 'landmark-placement', target, 'Place the site header and footer outside the main landmark')
  })

  const semanticChecksPassed = [
    results.missingReferences,
    results.buttonWrappers,
    results.nonNativeArrows,
    results.inaccessibleDots,
    results.exposedSlides,
    results.landmarksInMain
  ].every(list => list.length === 0) && results.skipLinkRole !== 'button'

  printResult(
    'project semantic checks',
    semanticChecksPassed
      ? 'pass'
      : 'fail'
  )
}

async function runInteractionChecks (browser) {
  const page = await browser.newPage({
    viewport: { width: 375, height: 812 },
    colorScheme: 'light',
    reducedMotion: 'reduce'
  })
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('html.site-ready')

  const menuTrigger = page.locator('#menu-trigger')
  await menuTrigger.focus()
  await page.keyboard.press('Enter')
  const menuExpanded = await menuTrigger.getAttribute('aria-expanded')
  const menuVisible = await page.locator('#menu').evaluate(element => getComputedStyle(element).display !== 'none')
  if (menuExpanded !== 'true' || !menuVisible) {
    addFailure('interactions', 'mobile-menu-keyboard', '#menu-trigger', 'Enter must open the menu and update aria-expanded')
  }
  printResult('mobile menu keyboard behavior', menuExpanded === 'true' && menuVisible ? 'pass' : 'fail')

  const nextTestimonial = page.locator('#right-arrow')
  await nextTestimonial.focus()
  await page.keyboard.press('Enter')
  let carouselState = await page.evaluate(() => ({
    activeSlide: document.querySelector('#testimonials .slide.active')?.id,
    previousHidden: document.querySelector('#testimonial-slide-1')?.getAttribute('aria-hidden'),
    activeHidden: document.querySelector('#testimonial-slide-2')?.getAttribute('aria-hidden'),
    currentDot: document.querySelector('#testimonials .dot[aria-current="true"]')?.dataset.slide
  }))
  const nextPassed = carouselState.activeSlide === 'testimonial-slide-2' &&
    carouselState.previousHidden === 'true' &&
    carouselState.activeHidden === null &&
    carouselState.currentDot === '2'

  const fourthDot = page.locator('#testimonials .dot-4')
  await fourthDot.focus()
  await page.keyboard.press('Enter')
  carouselState = await page.evaluate(() => ({
    activeSlide: document.querySelector('#testimonials .slide.active')?.id,
    previousHidden: document.querySelector('#testimonial-slide-2')?.getAttribute('aria-hidden'),
    activeHidden: document.querySelector('#testimonial-slide-4')?.getAttribute('aria-hidden'),
    currentDot: document.querySelector('#testimonials .dot[aria-current="true"]')?.dataset.slide
  }))
  const dotPassed = carouselState.activeSlide === 'testimonial-slide-4' &&
    carouselState.previousHidden === 'true' &&
    carouselState.activeHidden === null &&
    carouselState.currentDot === '4'

  if (!nextPassed || !dotPassed) {
    addFailure('interactions', 'testimonial-state', '#testimonials', 'Arrow and pagination controls must synchronize the visible and accessible slide state')
  }
  printResult('testimonial keyboard and ARIA state', nextPassed && dotPassed ? 'pass' : 'fail')

  const opener = page.locator('.hero .js-calendly-open')
  await opener.focus()
  await page.keyboard.press('Enter')
  await page.waitForTimeout(100)

  const modalState = await page.evaluate(() => {
    const modal = document.querySelector('#calendly-modal')
    const pageWrapper = document.querySelector('#page-wrapper')
    return {
      open: !modal.hidden,
      focusInside: Boolean(document.activeElement.closest('#calendly-modal')),
      backgroundIsolated: pageWrapper.hasAttribute('inert') || pageWrapper.getAttribute('aria-hidden') === 'true'
    }
  })

  if (!modalState.open || !modalState.focusInside) {
    addFailure('interactions', 'dialog-focus', '#calendly-modal', 'The dialog must open and receive focus')
  }
  if (!modalState.backgroundIsolated) {
    addFailure('interactions', 'dialog-background', '#page-wrapper', 'Make the background inert while the modal is open')
  }

  await page.keyboard.press('Escape')
  const modalClosed = await page.locator('#calendly-modal').getAttribute('hidden') !== null
  const focusReturned = await opener.evaluate(element => document.activeElement === element)
  if (!modalClosed || !focusReturned) {
    addFailure('interactions', 'dialog-close', '#calendly-modal', 'Escape must close the dialog and restore focus')
  }
  printResult('Calendly dialog keyboard behavior', modalState.open && modalState.focusInside && modalClosed && focusReturned ? 'pass' : 'fail')
  printResult('Calendly dialog background isolation', modalState.backgroundIsolated ? 'pass' : 'fail')

  await page.close()
}

async function main () {
  const launchOptions = { headless: true, channel: 'chrome' }
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE) {
    launchOptions.executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
    delete launchOptions.channel
  }

  let browser
  try {
    browser = await chromium.launch(launchOptions)
  } catch (error) {
    process.stderr.write('Unable to launch Google Chrome. Set PLAYWRIGHT_CHROMIUM_EXECUTABLE if Chrome uses a nonstandard path.\n')
    throw error
  }

  try {
    if (screenshotDir) {
      fs.mkdirSync(screenshotDir, { recursive: true })
    }

    for (const scenario of scenarios) {
      const page = await browser.newPage({
        viewport: scenario.viewport,
        colorScheme: scenario.colorScheme,
        reducedMotion: 'reduce'
      })
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })
      if (screenshotDir) {
        await loadLazyContent(page)
        await page.screenshot({
          path: path.join(screenshotDir, `${scenario.name.replace(/\s+/g, '-')}.png`),
          fullPage: true
        })
      }
      await runAxe(page, scenario)
      if (scenario.name === 'desktop light') {
        await runSemanticChecks(page)
      }
      await page.close()
    }
    await runInteractionChecks(browser)
  } finally {
    await browser.close()
  }

  if (manualReviews.length) {
    process.stdout.write(`\nManual review (${manualReviews.length})\n`)
    manualReviews.forEach(result => {
      process.stdout.write(`- [${result.scope}] ${result.rule} ${result.target}: ${result.message}\n`)
    })
  }

  if (failures.length) {
    process.stderr.write(`\nAccessibility failures (${failures.length})\n`)
    failures.forEach(failure => {
      process.stderr.write(`- [${failure.scope}] ${failure.rule} ${failure.target}: ${failure.message.replace(/\s+/g, ' ').trim()}\n`)
    })
    process.exitCode = 1
  } else {
    process.stdout.write('\nAccessibility audit passed.\n')
  }
}

main().catch(error => {
  process.stderr.write(`${error.stack || error.message}\n`)
  process.exitCode = 1
})
