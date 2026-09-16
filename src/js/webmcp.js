/**
 * @file Read-only WebMCP tools for peterschmalfeldt.com.
 * @author Peter Schmalfeldt
 *
 * START HERE
 * WebMCP lets a compatible browser agent discover named JavaScript functions
 * on an open page. Each tool has a description, an input schema, and an execute
 * callback. The browser supplies the agent connection; this file supplies the
 * site's functions. Registration makes a tool available. It does not call it.
 * This is a browser integration, not a remote MCP server or a search crawler API.
 * Discovery and execution depend on the browser, agent, and their permissions.
 *
 * REFERENCES
 * WebMCP is an evolving Community Group draft, not a W3C Standard.
 * API names and browser support can change. Check these sources when updating:
 * @see https://webmachinelearning.github.io/webmcp/ - WebMCP API specification
 * @see https://github.com/webmachinelearning/webmcp - Proposals and implementation status
 * @see https://developer.chrome.com/docs/ai/webmcp - Chrome implementation guidance
 * @see https://modelcontextprotocol.io/specification/2025-06-18/server/tools
 * The MCP reference explains the text-content result shape used here. This file
 * does not implement MCP transport, server initialization, or authentication.
 *
 * HOW THIS FILE REACHES THE PAGE
 * Gulp's copy-js task bundles JavaScript files under src/js/ into the app bundle.
 * src/html/layouts/default.html loads that bundle with defer, after HTML parsing.
 * The IIFE keeps helpers private and runs once for each full page load.
 * Unsupported browsers return immediately. No polyfill or registration-time
 * network request is needed. Only list_github_repositories fetches live data.
 *
 * DATA FLOW
 * src/html/data/profile.json -> #profile-data -> profile and resume tools.
 * src/html/data/projects.json -> #projects-data -> project search and detail.
 * Panini embeds both JSON blocks through src/html/includes/jsonld.html, using
 * the json helper to escape script-sensitive characters. These are public data.
 * Services and testimonials come from the home-page DOM and register only there.
 * There are nine tools on the home page and seven on resume and project pages.
 * Catalog descriptions and technology evidence are reviewed snapshots. They
 * are not live code scans. The linked PDF resume remains authoritative for skills.
 *
 * EXTENDING AND TESTING
 * Add a focused register(...) call with a specific description and narrow schema.
 * Return JSON-serializable data with source links and clear coverage limits.
 * Defaults belong in the callback; required fields also need runtime checks.
 * If a new schema uses other types or constraints, extend validate() as well.
 * Keep side effects explicit. Annotation hints do not enforce read-only behavior.
 * Use Node from .nvmrc, then npm run build:dev and npm run test:webmcp.
 * scripts/test-webmcp.js mocks registration and GitHub responses in a browser.
 * Passing those tests does not prove native agent discovery in a particular app.
 * See docs/webmcp.md and docs/profile-publishing.md for maintenance details.
 */
;(function () {
  // Prefer the current Document API. Keep Navigator support for earlier hosts.
  // Feature detection avoids tying this optional feature to browser names.
  const context = document.modelContext && typeof document.modelContext.registerTool === 'function'
    ? document.modelContext
    : navigator.modelContext
  if (!context || typeof context.registerTool !== 'function') return

  const siteUrl = 'https://peterschmalfeldt.com/'
  const text = element => element ? element.textContent.replace(/\s+/g, ' ').trim() : null
  const all = (selector, root = document) => Array.from(root.querySelectorAll(selector))
  const paragraphs = element => all('p', element).map(text)
  const source = anchor => siteUrl + (anchor ? '#' + anchor : '')

  /** Read the same public profile data that supplies the rendered pages. */
  function profile () {
    const element = document.getElementById('profile-data')
    if (!element) throw new Error('The professional profile is unavailable.')
    return JSON.parse(element.textContent)
  }

  /** Return a fresh links object without changing the embedded profile. */
  function links () {
    const data = profile()
    return Object.assign({}, data.links, { email: 'mailto:' + data.email })
  }

  /** Read the curated catalog, including source evidence and coverage limits. */
  function catalog () {
    const element = document.getElementById('projects-data')
    if (!element) throw new Error('The project catalog is unavailable.')
    return JSON.parse(element.textContent)
  }

  // ASCII matching makes "NextJS" and "Next.js" equivalent. This is not
  // semantic search, stemming, or a general technology alias table.
  const normalize = value => value.toLowerCase().replace(/[^a-z0-9]/g, '')

  // All supplied filters must match. Preserve the catalog's published order:
  // non-archived projects first, then archived projects, newest in each group.
  // This search and get_project read embedded data, with no network requests.
  register('search_projects', 'Search Peter\'s published project catalog across manifestinteractive, FindByColor, PoliceScorecard, sfccdevops, and opensfcc. Filter by technology and project type. Query searches names, descriptions, and the stack; combine technology Python with query Streamlit. Results include technology sources and resume skill matches. Dependency evidence does not verify production use or specific AI models. Missing results do not prove no experience.', {
    query: { type: 'string', description: 'Project name, organization, or description. Defaults to all projects.' },
    technology: { type: 'string', description: 'Exact technology name, ignoring punctuation and case; NextJS and Next.js are equivalent.' },
    project_type: { type: 'string', description: 'Project type, such as CLI tool, API, Web application, or Browser extension.' },
    page: { type: 'integer', minimum: 1, maximum: 100, description: 'Page number. Defaults to 1.' },
    per_page: { type: 'integer', minimum: 1, maximum: 30, description: 'Results per page. Defaults to 10.' }
  }, ({ query = '', technology = '', project_type: projectType = '', page = 1, per_page: perPage = 10 }) => {
    const data = catalog()
    const matches = data.projects.filter(project =>
      normalize([project.id, project.name, project.organization, project.summary, ...project.technologies, ...project.project_types].join(' ')).includes(normalize(query)) &&
      (!technology || project.technologies.some(item => normalize(item) === normalize(technology))) &&
      (!projectType || project.project_types.some(item => normalize(item).includes(normalize(projectType))))
    )
    return {
      source: data.source,
      reviewed_on: data.reviewed_on,
      coverage: data.coverage,
      total: matches.length,
      next_page: page * perPage < matches.length ? page + 1 : null,
      projects: matches.slice((page - 1) * perPage, page * perPage)
    }
  }, true)

  // Use the stable ID from search results rather than guessing repository URLs.
  // A missing project is a normal result; an absent or blank ID is invalid input.
  register('get_project', 'Read a project by its catalog ID returned by search_projects. Includes Peter\'s last public commit, technology evidence, license and source links. Does not claim sole authorship or fetch live source code.', {
    id: { type: 'string', description: 'Catalog ID, for example PoliceScorecard/api or opensfcc/sfcc-docs.' }
  }, ({ id }) => {
    if (!id || !id.trim()) throw new Error('A project id is required.')
    const data = catalog()
    const project = data.projects.find(item => item.id.toLowerCase() === id.toLowerCase())
    return { source: data.source, reviewed_on: data.reviewed_on, coverage: data.coverage, status: project ? 'found' : 'not_found', project: project || null }
  }, true, ['id'])

  /** Fail explicitly when expected DOM content is absent instead of inventing it. */
  function requireElement (selector) {
    const element = document.querySelector(selector)
    if (!element) throw new Error('The requested site content is unavailable.')
    return element
  }

  /**
   * Validate the small JSON Schema subset used by this file.
   *
   * Reject unknown keys, incorrect string/integer types, invalid enums, and
   * out-of-range integers. This is not a complete JSON Schema validator.
   * It checks supplied values only. Required field presence and non-empty
   * strings are checked by callbacks such as get_project.
   *
   * @param {Object} args Arguments supplied by the caller.
   * @param {Object} properties The tool's inputSchema.properties definitions.
   * @throws {Error} When the argument object or a supplied value is invalid.
   */
  function validate (args, properties) {
    if (!args || typeof args !== 'object' || Array.isArray(args)) throw new Error('Arguments must be an object.')
    Object.keys(args).forEach(key => {
      if (!Object.prototype.hasOwnProperty.call(properties, key)) throw new Error('Unknown argument: ' + key)
      const rule = properties[key]
      const value = args[key]
      if (rule.type === 'integer' && (!Number.isInteger(value) || value < rule.minimum || value > rule.maximum)) {
        throw new Error(key + ' must be an integer from ' + rule.minimum + ' to ' + rule.maximum + '.')
      }
      if (rule.type === 'string' && (typeof value !== 'string' || (rule.enum && !rule.enum.includes(value)))) {
        throw new Error('Invalid value for ' + key + '.')
      }
    })
  }

  /**
   * Register one tool with a shared schema, validation, and result convention.
   *
   * Descriptions help an agent decide when a tool is useful. The input schema
   * describes accepted arguments; runtime validation also protects callbacks.
   * readOnlyHint and untrustedContentHint are metadata, not security boundaries.
   * A false untrusted flag does not make tool output authoritative instructions.
   *
   * @param {string} name Stable tool identifier within this document.
   * @param {string} description Purpose and limitations visible to the agent.
   * @param {Object} properties JSON Schema properties accepted by the tool.
   * @param {Function} execute Callback receiving (args, options), returning data
   * or a Promise of data. options.signal may request cancellation.
   * @param {boolean} [untrusted=false] Flag quoted or externally sourced content.
   * @param {string[]} [required=[]] Required keys advertised in the schema.
   * @returns {void} Registration failures are logged without stopping the page.
   */
  function register (name, description, properties, execute, untrusted = false, required = []) {
    const tool = {
      name,
      description,
      inputSchema: { type: 'object', properties, required, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: untrusted },
      execute: async (args = {}, options = {}) => {
        validate(args, properties)
        if (options.signal && options.signal.aborted) throw new Error('Tool execution canceled.')
        const result = await execute(args, options)
        // This site's compatibility convention is an MCP-style text envelope.
        // The text is JSON so consumers can retain fields and source URLs.
        // Do not mistake this wrapper for a universal WebMCP return requirement.
        return { content: [{ type: 'text', text: JSON.stringify(result) }] }
      }
    }
    try {
      // Hosts can throw immediately or reject asynchronously. Handle both so
      // one unavailable tool does not prevent the others from registering.
      Promise.resolve(context.registerTool(tool)).catch(error => {
        console.warn('WebMCP could not register ' + name + ': ' + error.message)
      })
    } catch (error) {
      console.warn('WebMCP could not register ' + name + ': ' + error.message)
    }
  }

  // Use stored metric values, not animated counters read during page load.
  // Links to external profiles do not imply that their content was retrieved.
  register('get_profile', 'Read Peter Schmalfeldt\'s biography, skill areas, experience metrics and professional links from this page. LinkedIn is a link only; its content is not available here.', {}, () => {
    const data = profile()
    return {
      source: source(),
      name: data.name || null,
      job_title: data.job_title,
      summary: data.summary,
      skills: data.skills,
      skills_source: data.sources.skills,
      reviewed_on: data.reviewed_on,
      metrics: data.metrics.map(metric => ({
        value: metric.prefix + metric.count + metric.suffix,
        label: metric.label
      })),
      links: links(),
      linkedin_content_available: false
    }
  })

  // DOM-backed tools register only on pages that contain their source sections.
  // Shared profile/catalog tools above and below are available on every page.
  const categories = { consulting: '#consulting', services: '#services', process: '#process', engagement: '.engagement-section' }
  if (document.querySelector('#services')) {
    register('list_services', 'Read consulting options, engineering services, process steps and team engagement models. Includes published availability, but no live booking slots or prices.', {
      category: { type: 'string', enum: ['all'].concat(Object.keys(categories)), description: 'Section to return. Defaults to all.' }
    }, ({ category = 'all' }) => ({
      sections: Object.keys(categories).filter(key => category === 'all' || key === category).map(key => {
        const section = requireElement(categories[key])
        return {
          category: key,
          source: source(section.id || 'engagement-title'),
          title: text(section.querySelector('h2')),
          introduction: text(section.querySelector('.section-heading p')),
          availability: text(section.querySelector('.consulting-availability')),
          offerings: all('article, .process-list li', section).map((item, index) => ({
            title: text(item.querySelector('h3')),
            description: paragraphs(item).join(' '),
            step: key === 'process' ? index + 1 : null
          }))
        }
      })
    }))
  }

  // Read all carousel slides, not only the visible slide. Keep attribution and
  // mark quotes as untrusted content; they are recommendations, not tool policy.
  if (document.querySelector('#testimonials')) {
    register('list_testimonials', 'Read attributed testimonials published on this site, including inactive carousel slides. These are personal recommendations, not independently verified outcomes.', {
      limit: { type: 'integer', minimum: 1, maximum: 10, description: 'Maximum testimonials. Defaults to 10.' }
    }, ({ limit = 10 }) => {
      const slides = all('#testimonials .slide')
      return {
        total: slides.length,
        testimonials: slides.slice(0, limit).map(slide => ({
          source: source(slide.id), author: text(slide.querySelector('strong')), quote: text(slide.querySelector('p'))
        }))
      }
    }, true)
  }

  // Return the published explanation and links, without processing the video.
  register('get_prototype_showcase', 'Read the featured prototype description, limitations, video link and source repository. Does not transcribe or play the video.', {}, () => {
    const project = profile().project
    return {
      source: source('prototype'),
      title: project.title,
      description: [project.description, project.principle, project.limitations],
      walkthrough: project.walkthrough,
      repository: project.repository
    }
  })

  // Discovery only: these results do not send messages or reserve appointments.
  register('get_contact_options', "Read Peter's email and scheduling links, published availability and consulting options. Does not send email, open windows, or book appointments. Live slots and rates must be checked on Calendly.", {}, () => ({
    source: source('consulting'),
    email: links().email,
    booking: links().booking,
    availability: profile().availability,
    options: profile().consulting,
    booking_created: false,
    email_sent: false
  }))

  // Return the reviewed resume snapshot. Never infer skills from repository
  // dependencies or treat an external PDF link as a freshly fetched document.
  register('get_resume', 'Read the published HTML resume data, including career highlights, all skill groups, certifications and education. Skills come from the linked PDF resume. Includes source links and a review date; this is not a live PDF fetch.', {}, () => {
    const data = profile()
    return {
      source: data.links.resume,
      pdf: data.links.pdf,
      skills_source: data.sources.skills,
      reviewed_on: data.reviewed_on,
      coverage: 'Career highlights and skills from the PDF resume. Present means present on the review date.',
      summary: data.resume_summary,
      experience: data.experience,
      skills: data.skills,
      certifications: data.certifications,
      education: data.education
    }
  })

  /**
   * The only network-backed tool in this file.
   *
   * The owner enum limits requests to known accounts. The endpoint is fixed;
   * callers cannot supply arbitrary URLs, credentials, or private repository IDs.
   * GitHub supplies current metadata, while the catalog controls inclusion.
   *
   * Pagination follows GitHub's API pages, not the filtered catalog. A page can
   * have zero included repositories and still have a next_page. Follow the Link
   * header rather than guessing from the number of returned entries.
   *
   * updated_at is repository metadata, not Peter's last contribution date.
   * language is GitHub's primary language, not the full stack. Use search_projects
   * or get_project for the reviewed stack and contribution evidence.
   * @see https://docs.github.com/en/rest/repos/repos#list-repositories-for-a-user
   */
  register('list_github_repositories', 'Fetch live repository metadata for projects included in the published catalog, for one supported account or organization. Excluded projects are omitted; an API page may contain no included projects. Organization membership and repository ownership do not establish Peter\'s contributions; use search_projects for attribution. Includes forks and archives. Use page for more results.', {
    owner: { type: 'string', enum: ['manifestinteractive', 'FindByColor', 'PoliceScorecard', 'sfccdevops', 'opensfcc'], description: 'Repository owner. Defaults to manifestinteractive.' },
    page: { type: 'integer', minimum: 1, maximum: 100, description: 'Page number. Defaults to 1.' },
    per_page: { type: 'integer', minimum: 1, maximum: 30, description: 'Repositories per page. Defaults to 10.' }
  }, async ({ owner = 'manifestinteractive', page = 1, per_page: perPage = 10 }, options) => {
    // A private controller combines caller cancellation with an eight-second
    // timeout. Never abort the caller's signal or leave listeners behind.
    const controller = new AbortController()
    const cancel = () => controller.abort()
    const signal = options.signal
    if (signal) signal.addEventListener('abort', cancel, { once: true })
    const timeout = setTimeout(cancel, 8000)
    const apiUrl = 'https://api.github.com/users/' + owner + '/repos?type=owner&sort=updated&direction=desc&per_page=' + perPage + '&page=' + page
    try {
      const response = await fetch(apiUrl, { signal: controller.signal, credentials: 'omit', referrerPolicy: 'no-referrer', headers: { Accept: 'application/vnd.github+json' } })
      // Service/rate-limit failures are unavailable results, not empty success.
      if (!response.ok) {
        return { status: 'unavailable', http_status: response.status, source: 'https://github.com/' + owner, message: 'GitHub could not return repositories. Rate limits or service errors may apply.' }
      }
      const repos = await response.json()
      if (!Array.isArray(repos)) throw new Error('Unexpected GitHub response.')
      return {
        source: apiUrl,
        retrieved_at: new Date().toISOString(),
        page,
        next_page: /rel="next"/.test(response.headers.get('link') || '') ? page + 1 : null,
        // Apply the publication allowlist after fetching. This keeps excluded
        // projects out of live results as well as the static catalog.
        repositories: repos.filter(repo => catalog().projects.some(project => project.id === (owner + '/' + repo.name).toLowerCase())).map(repo => ({
          name: repo.name,
          url: repo.html_url,
          description: repo.description,
          language: repo.language,
          fork: repo.fork,
          archived: repo.archived,
          updated_at: repo.updated_at
        }))
      }
    } catch (error) {
      // Preserve caller cancellation as an error. Timeouts and network errors
      // instead produce an explicit unavailable result with no invented data.
      if (signal && signal.aborted) throw new Error('Tool execution canceled.')
      return { status: 'unavailable', source: 'https://github.com/' + owner, message: 'GitHub lookup failed or timed out. No repository results are available.' }
    } finally {
      clearTimeout(timeout)
      if (signal) signal.removeEventListener('abort', cancel)
    }
  }, true)
})()
