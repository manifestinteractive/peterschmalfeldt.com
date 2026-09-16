/* eslint-env node */
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright-core')

async function main () {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' })
  try {
    for (const mode of ['document', 'navigator', 'unsupported', 'rejected', 'throws']) {
      const page = await browser.newPage()
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      await page.route('**/*', route => {
        const url = new URL(route.request().url())
        if (url.origin !== 'http://localhost:8081') return route.abort()
        const file = path.join(__dirname, '../dist', url.pathname === '/' ? 'index.html' : url.pathname)
        if (!fs.existsSync(file)) return route.abort()
        return route.fulfill({ path: file })
      })
      await page.addInitScript(mode => {
        window.testTools = {}
        // This test serves files through Playwright routes, not an HTTP server.
        // Service worker requests bypass those routes and are outside this test.
        if (navigator.serviceWorker) navigator.serviceWorker.register = async () => ({})
        const registerTool = tool => {
          if (mode === 'rejected') return Promise.reject(new Error('Registration denied'))
          if (mode === 'throws') throw new Error('Registration denied')
          window.testTools[tool.name] = tool
          return mode === 'document' ? Promise.resolve() : undefined
        }
        Object.defineProperty(document, 'modelContext', { value: undefined, configurable: true })
        Object.defineProperty(navigator, 'modelContext', { value: undefined, configurable: true })
        if (mode !== 'unsupported') {
          Object.defineProperty(mode === 'navigator' ? navigator : document, 'modelContext', { value: { registerTool }, configurable: true })
        }
      }, mode)
      await page.goto('http://localhost:8081/', { waitUntil: 'load' })
      const names = await page.evaluate(() => Object.keys(window.testTools))
      if (mode !== 'document' && mode !== 'navigator') {
        assert.strictEqual(names.length, 0)
      } else {
        assert.strictEqual(names.length, 9)
        const results = await page.evaluate(async () => {
          const call = async (name, args = {}, options = {}) => JSON.parse((await window.testTools[name].execute(args, options)).content[0].text)
          const profile = await call('get_profile')
          const services = await call('list_services')
          const engagement = await call('list_services', { category: 'engagement' })
          const testimonials = await call('list_testimonials')
          const prototype = await call('get_prototype_showcase')
          const contact = await call('get_contact_options')
          const resume = await call('get_resume')
          const nextProjects = await call('search_projects', { technology: 'NextJS' })
          if (!nextProjects.projects.some(project => project.id === 'opensfcc/sfcc-docs')) throw new Error('Missing organization Next.js project')
          if (!nextProjects.projects.every(project => project.technologies.includes('Next.js'))) throw new Error('Incorrect technology match')
          const streamlit = await call('search_projects', { technology: 'Python', query: 'Streamlit' })
          if (!streamlit.projects.some(project => project.id === 'findbycolor/image-processor')) throw new Error('Missing Streamlit evidence')
          for (const technology of ['Ollama', 'OpenAI', 'PHP', 'Docker']) {
            const matches = await call('search_projects', { technology })
            if (!matches.total || !matches.projects.every(project => project.technology_evidence.some(item => item.technology === technology))) throw new Error('Missing technology evidence: ' + technology)
          }
          const cli = await call('search_projects', { project_type: 'CLI' })
          if (!cli.total || !cli.projects.every(project => project.project_types.includes('CLI tool'))) throw new Error('Incorrect project type filter')
          const police = await call('search_projects', { query: 'Police Scorecard' })
          if (police.total !== 2) throw new Error('Missing Police Scorecard projects')
          const detail = await call('get_project', { id: 'PoliceScorecard/api' })
          if (detail.status !== 'found' || !detail.project.sources.some(source => source.url.includes('/commit/'))) throw new Error('Missing contribution evidence')
          if ((await call('get_project', { id: 'unknown' })).status !== 'not_found') throw new Error('Unknown project invented')
          if ((await call('search_projects', { technology: 'nonexistent' })).total !== 0) throw new Error('Unexpected search result')
          const first = await call('search_projects', { per_page: 1 })
          const second = await call('search_projects', { per_page: 1, page: 2 })
          if (first.next_page !== 2 || first.projects[0].id === second.projects[0].id) throw new Error('Invalid pagination')
          const invalid = []
          for (const [name, args] of [
            ['list_services', { category: 'unknown' }], ['list_testimonials', { limit: 0 }],
            ['list_testimonials', { limit: 1.5 }], ['get_profile', { url: 'https://example.com' }],
            ['list_github_repositories', { page: '1' }], ['get_resume', null], ['get_project', {}], ['search_projects', { technology: 12 }], ['list_github_repositories', { owner: '../other' }]
          ]) {
            try { await call(name, args); invalid.push(false) } catch (error) { invalid.push(true) }
          }
          let requested
          window.fetch = async (url, options) => {
            requested = { url, credentials: options.credentials }
            return {
              ok: true,
              headers: { get: () => '<next>; rel="next"' },
              json: async () => [{ name: 'api', html_url: 'https://github.com/PoliceScorecard/api', fork: true, archived: false }, { name: 'excluded-project', html_url: 'https://github.com/PoliceScorecard/excluded-project' }]
            }
          }
          const github = await call('list_github_repositories', { owner: 'PoliceScorecard', page: 2, per_page: 5 })
          window.fetch = async () => ({ ok: false, status: 403 })
          const rateLimit = await call('list_github_repositories')
          window.fetch = async () => { throw new Error('Network unavailable') }
          const offline = await call('list_github_repositories')
          const controller = new AbortController()
          controller.abort()
          let canceled = false
          try { await call('list_github_repositories', {}, { signal: controller.signal }) } catch (error) { canceled = true }
          window.fetch = (url, options) => new Promise((resolve, reject) => {
            options.signal.addEventListener('abort', () => reject(new Error('Aborted')), { once: true })
          })
          const pendingController = new AbortController()
          const pending = call('list_github_repositories', {}, { signal: pendingController.signal })
          pendingController.abort()
          let canceledDuringFetch = false
          try { await pending } catch (error) { canceledDuringFetch = true }
          const originalTimeout = window.setTimeout
          window.setTimeout = callback => originalTimeout(callback, 0)
          const timeout = await call('list_github_repositories')
          window.setTimeout = originalTimeout
          return { profile, services, engagement, testimonials, prototype, contact, resume, invalid, github, requested, rateLimit, offline, canceled, canceledDuringFetch, timeout }
        })
        assert.match(results.profile.summary, /^I work with teams/)
        assert.strictEqual(results.profile.metrics.length, 4)
        assert.strictEqual(results.profile.metrics[0].value, '25+ years')
        assert.strictEqual(results.profile.links.github, 'https://github.com/manifestinteractive')
        assert.match(results.profile.links.linkedin, /linkedin.com\/in\/peter-schmalfeldt/)
        assert.strictEqual(results.profile.links.resume, 'https://peterschmalfeldt.com/resume.html')
        assert.strictEqual(results.services.sections.length, 4)
        assert(results.services.sections.every(section => section.offerings.every(item => item.description)))
        assert.strictEqual(results.engagement.sections[0].offerings.length, 2)
        assert.strictEqual(results.testimonials.testimonials.length, 10)
        assert(results.testimonials.testimonials.every(item => item.author && item.quote && item.source))
        assert(results.prototype.description.some(line => line.includes('not clinically validated')))
        assert.strictEqual(results.contact.email, 'mailto:me@peterschmalfeldt.com')
        assert.strictEqual(results.contact.booking_created, false)
        assert.strictEqual(results.resume.reviewed_on, '2026-09-15')
        assert.strictEqual(results.resume.experience.length, 4)
        assert.strictEqual(results.resume.skills.length, 7)
        assert.strictEqual(results.resume.skills_source, results.resume.pdf)
        assert(results.invalid.every(Boolean))
        assert.strictEqual(results.github.next_page, 3)
        assert.strictEqual(results.github.repositories.length, 1)
        assert.strictEqual(results.github.repositories[0].fork, true)
        assert.match(results.requested.url, /users\/PoliceScorecard\/repos.*per_page=5&page=2$/)
        assert.strictEqual(results.requested.credentials, 'omit')
        assert.strictEqual(results.rateLimit.http_status, 403)
        assert.strictEqual(results.offline.status, 'unavailable')
        assert.strictEqual(results.canceled, true)
        assert.strictEqual(results.canceledDuringFetch, true)
        assert.strictEqual(results.timeout.status, 'unavailable')
      }
      assert.deepStrictEqual(errors, [])
      if (mode === 'document') {
        await page.goto('http://localhost:8081/resume.html', { waitUntil: 'load' })
        const resumePage = await page.evaluate(async () => ({
          names: Object.keys(window.testTools),
          resume: JSON.parse((await window.testTools.get_resume.execute({})).content[0].text),
          embedded: JSON.parse(document.getElementById('profile-data').textContent),
          schema: JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent)
        }))
        assert.strictEqual(resumePage.names.length, 7)
        assert.deepStrictEqual(resumePage.resume.skills, resumePage.embedded.skills)
        assert.deepStrictEqual(resumePage.schema.mainEntity.knowsAbout, [...new Set(resumePage.resume.skills.flatMap(group => group.items))])
        assert.deepStrictEqual(errors, [])
      }
      console.log('PASS WebMCP ' + mode)
      await page.close()
    }
  } finally {
    await browser.close()
  }
}

main().catch(error => { console.error(error); process.exitCode = 1 })
