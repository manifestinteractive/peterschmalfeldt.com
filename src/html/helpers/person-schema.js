const serialize = require('./json')

module.exports = function (profile, detailed) {
  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': profile.links.website + '#person',
    name: profile.name,
    givenName: profile.given_name,
    familyName: profile.family_name,
    url: profile.links.website,
    email: profile.email,
    jobTitle: profile.job_title,
    description: profile.summary,
    sameAs: [profile.links.linkedin, profile.links.github],
    mainEntityOfPage: profile.links.resume
  }
  if (detailed === true) {
    person.description = profile.resume_summary.join(' ')
    person.knowsAbout = [...new Set(profile.skills.reduce((items, group) => items.concat(group.items), []))]
    person.worksFor = profile.experience.filter(role => !role.end).map(role => ({ '@type': 'Organization', name: role.employer }))
    person.alumniOf = { '@type': 'CollegeOrUniversity', name: profile.education.institution }
    person.hasCredential = profile.certifications.map(credential => ({
      '@type': 'EducationalOccupationalCredential',
      name: credential.name,
      credentialCategory: 'Certification',
      recognizedBy: { '@type': 'Organization', name: credential.issuer }
    }))
    return serialize({
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      '@id': profile.links.resume + '#webpage',
      url: profile.links.resume,
      name: profile.name + ' - Resume',
      dateModified: profile.modified_on,
      lastReviewed: profile.reviewed_on,
      mainEntity: person
    })
  }
  return serialize(person)
}
