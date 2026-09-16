module.exports = function (projects) {
  const sorted = projects.slice().sort((a, b) => (b.last_contribution || '').localeCompare(a.last_contribution || '') || a.id.localeCompare(b.id))
  return [
    { title: 'Projects', id: 'current-projects', projects: sorted.filter(project => !project.archived) },
    { title: 'Archived', id: 'archived-projects', projects: sorted.filter(project => project.archived) }
  ]
}
