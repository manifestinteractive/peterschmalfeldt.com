/* eslint-env node */
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const { readProfile } = require('./profile-content')
const serialize = require('../src/html/helpers/json')
const read = file => fs.readFileSync(path.join(__dirname, '../dist', file), 'utf8')
const profile = readProfile()
const built = JSON.parse(read('profile.json'))
assert.deepStrictEqual(built, profile)
const markdown = read('profile.md')
const discovery = read('llms.txt')
const sitemap = read('sitemap.xml')
for (const page of ['index.html', 'resume.html', 'projects.html']) {
  const html = read(page)
  const embedded = html.match(/<script id="profile-data" type="application\/json">([\s\S]*?)<\/script>/)
  assert(embedded, 'Missing profile data in ' + page)
  assert.deepStrictEqual(JSON.parse(embedded[1]), profile)
  assert(html.includes('href="/resume.html"'), 'Missing HTML resume link')
  assert(!html.includes('{{'), 'Unresolved template in ' + page)
}
const resume = read('resume.html')
const escape = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#x27;').replace(/"/g, '&quot;').replace(/`/g, '&#x60;').replace(/=/g, '&#x3D;')
profile.skills.forEach(group => group.items.forEach(skill => {
  assert(resume.includes(escape(skill)), 'Skill missing from HTML: ' + skill)
  assert(markdown.includes('- ' + skill + '\n'), 'Skill missing from Markdown: ' + skill)
}))
assert(resume.includes('href="' + profile.links.pdf + '"'))
assert(resume.includes('href="/#services"'))
assert(resume.includes('href="#skills"'))
assert(resume.includes('href="' + profile.links.resume + '"'))
assert(sitemap.includes('<loc>' + profile.links.resume + '</loc>'))
assert(sitemap.includes('<loc>' + profile.links.website + '</loc>'))
assert.strictEqual((sitemap.match(/<lastmod>/g) || []).length, 3)
for (const page of ['index.html', 'resume.html', 'projects.html']) {
  const source = fs.readFileSync(path.join(__dirname, '../src/html/pages', page), 'utf8')
  const modified = source.match(/^modified: (\d{4}-\d{2}-\d{2})$/m)[1]
  const expected = [modified, profile.modified_on].sort().pop()
  assert(sitemap.includes('<lastmod>' + expected + 'T00:00:00.000Z</lastmod>'))
}
assert(discovery.includes(profile.links.resume))
assert(discovery.includes(profile.sources.skills))
const hostile = { value: '</script><script>alert(1)</script>\u2028' }
assert(!serialize(hostile).includes('<'))
assert.deepStrictEqual(JSON.parse(serialize(hostile)), hostile)
console.log('PASS profile consistency, HTML skills, source links, sitemap dates, and JSON escaping')

const catalog = JSON.parse(read('projects.json'))
const projectHtml = read('projects.html')
assert.deepStrictEqual(catalog, JSON.parse(fs.readFileSync(path.join(__dirname, '../src/html/data/projects.json'), 'utf8')))
assert.strictEqual(new Set(catalog.projects.map(project => project.id)).size, catalog.projects.length)
for (const project of catalog.projects) {
  assert(projectHtml.includes(escape(project.name)))
  assert(read('projects.md').includes('ID: ' + project.id))
  assert(project.sources.length > 0)
}
assert(sitemap.includes('<loc>https://peterschmalfeldt.com/projects.html</loc>'))
assert(discovery.includes('projects.json'))
console.log('PASS project catalog publication and discovery')

const groups = require('../src/html/helpers/project-groups')(catalog.projects)
assert(groups[0].projects.every(project => !project.archived))
assert(groups[1].projects.every(project => project.archived))
for (const group of groups) {
  const dates = group.projects.map(project => project.last_contribution)
  assert.deepStrictEqual(dates, dates.slice().sort().reverse())
}
for (const project of catalog.projects) {
  assert(project.readme_url && project.last_contribution_url)
  assert(/^\d{4}-\d{2}-\d{2}$/.test(project.last_contribution))
}
assert(!projectHtml.includes('Evidence: Repository ownership'))
assert(!projectHtml.includes('I publish this repository'))
assert(!catalog.projects.some(project => project.id === 'police-data' || project.id.startsWith('manifestinteractive/mmm-')))
assert(projectHtml.includes('id="archived-projects"'))
console.log('PASS project ordering, archive groups, dates, and README sources')

for (const project of catalog.projects) {
  assert(project.project_types.length)
  assert(project.technologies.every(technology => project.technology_evidence.some(item => item.technology === technology)))
  assert(project.resume_skills.every(skill => profile.skills.some(group => group.items.includes(skill))))
  assert(projectHtml.includes('href="' + project.organization_url + '"'))
}
const policeWebsite = catalog.projects.find(project => project.id === 'policescorecard/website')
for (const technology of ['PHP', 'Blade', 'Laravel', 'Livewire', 'Docker']) assert(policeWebsite.technologies.includes(technology))
assert(!projectHtml.includes('Read the README</a>'))
assert(!projectHtml.includes('>View Repository</a>'))
for (const project of catalog.projects) {
  assert(projectHtml.includes('<h3 id="project-' + project.id + '"><a href="' + project.repository_url + '" target="_blank" rel="noopener nofollow" data-track data-category="Nav" data-action="Projects" data-label="' + escape(project.name) + '">' + escape(project.name) + '</a></h3>'))
}
console.log('PASS technology evidence, resume skill matching, and project links')
