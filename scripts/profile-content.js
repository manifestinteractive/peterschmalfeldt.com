/* eslint-env node */
const fs = require('fs')
const path = require('path')

function readProfile () {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '../src/html/data/profile.json'), 'utf8'))
}

function buildProfileContent () {
  const p = readProfile()
  const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/html/data/projects.json'), 'utf8'))
  const projectLines = ['# Projects and contributions', '', 'Reviewed: ' + catalog.reviewed_on, '', catalog.coverage, '']
  catalog.projects.forEach(project => {
    projectLines.push('## ' + project.organization + ' / ' + project.name, '', 'ID: ' + project.id, '', project.summary, '', 'Last Contribution: ' + project.last_contribution, '', 'Project types: ' + project.project_types.join(', '), ...project.technology_groups.map(group => group.category + ': ' + group.items.join(', ')), 'Resume skill matches: ' + project.resume_skills.join(', '), 'License: ' + project.license, 'Archived: ' + project.archived + '; Fork: ' + project.fork, '', ...project.sources.map(item => '- [' + item.label + '](' + item.url + ')'), '')
  })
  const lines = [
    '# ' + p.name,
    '',
    p.job_title,
    '',
    p.location,
    '',
    'Reviewed: ' + p.reviewed_on,
    'Modified: ' + p.modified_on,
    'HTML profile: ' + p.links.resume,
    'PDF resume: ' + p.links.pdf,
    '',
    ...p.resume_summary.flatMap(paragraph => [paragraph, '']),
    '## Experience',
    ''
  ]
  p.experience.forEach(role => lines.push('### ' + role.role, '', role.employer + ' | ' + role.dates + ' | ' + role.arrangement, '', ...role.highlights.map(item => '- ' + item), ''))
  lines.push('## Skills', '', p.skills_note, '', 'Source: ' + p.sources.skills, '')
  p.skills.forEach(group => lines.push('### ' + group.category, '', ...group.items.map(item => '- ' + item), ''))
  lines.push('## Certifications', '', ...p.certifications.map(item => '- ' + item.name + ' - ' + item.issuer + ', ' + item.year), '', '## Education', '', p.education.degree, p.education.institution + ', ' + p.education.location + ' - ' + p.education.year, p.education.details, '', '## Project example', '', p.project.title, '', p.project.description, '', p.project.principle, '', p.project.limitations, '', 'Walkthrough: ' + p.project.walkthrough, 'Repository: ' + p.project.repository, '', '## Consulting', '', p.availability, '')
  p.consulting.forEach(item => lines.push('### ' + item.title, '', item.description, ''))
  lines.push('## Common questions', '')
  p.questions.forEach(item => lines.push('### ' + item.question, '', item.answer, ''))
  lines.push('## Links', '', ...Object.keys(p.links).map(key => '- ' + key + ': ' + p.links[key]), '- email: mailto:' + p.email, '')
  const discovery = [
    '# ' + p.name,
    '',
    '> Professional information published by Peter Schmalfeldt, a Senior Full-Stack & AI Engineer and Solutions Architect.',
    '',
    'Reviewed: ' + p.reviewed_on + '. Skills are reproduced from the PDF resume, which is their source of truth.',
    '',
    '## Professional information',
    '',
    '- [Resume](' + p.links.resume + '): Career highlights, complete skill groups, qualifications, project example, and common questions.',
    '- [Profile as Markdown](' + p.links.website + 'profile.md): Text version generated from the same data as the HTML resume.',
    '- [Profile as JSON](' + p.links.website + 'profile.json): Structured profile data, dates, and source URLs.',
    '- [PDF resume](' + p.links.pdf + '): Source of truth for skills and source for career details.',
    '- [Services](' + p.links.website + '#services): Engineering services and consulting information.',
    '',
    '## External profiles',
    '',
    '- [Project catalog](' + p.links.website + 'projects.html): Projects across my GitHub account and organizations, with contribution evidence.',
    '- [Projects as JSON](' + p.links.website + 'projects.json): Searchable project records with technologies and sources.',
    '- [Projects as Markdown](' + p.links.website + 'projects.md): Text version of the project catalog.',
    '- [GitHub](' + p.links.github + '): Public projects.',
    '- [LinkedIn](' + p.links.linkedin + '): Professional profile; access may require a login.',
    '',
    '## Contact',
    '',
    '- [Scheduling](' + p.links.booking + '): Current appointment options.',
    '- [Email](mailto:' + p.email + '): Direct contact.',
    ''
  ]
  fs.mkdirSync(path.join(__dirname, '../dist'), { recursive: true })
  for (const [name, content] of Object.entries({ 'projects.json': JSON.stringify(catalog, null, 2) + '\n', 'projects.md': projectLines.join('\n'), 'profile.json': JSON.stringify(p, null, 2) + '\n', 'profile.md': lines.join('\n'), 'llms.txt': discovery.join('\n') })) {
    fs.writeFileSync(path.join(__dirname, '../dist', name), content)
  }
}

module.exports = { readProfile, buildProfileContent }
