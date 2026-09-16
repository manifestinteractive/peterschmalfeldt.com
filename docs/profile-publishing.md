# Professional information and AI discovery

The PDF resume at https://resume.peterschmalfeldt.com/ is the source of truth for skills.
The HTML resume summarizes its career details and reproduces its complete skill groups.
The PDF remains separately maintained; this repository does not regenerate it.

## Shared data

Edit `src/html/data/profile.json` after checking the PDF resume.
Keep skill names and categories aligned with the PDF. Do not infer extra skills from a project or a profile.
The source URLs and `reviewed_on` date identify the evidence and review date.
An employment record with `end: null` means current as of that review date.

The shared data supplies:

- `/resume.html`, including career highlights, skills, qualifications, a project example, and common questions.
- `/profile.json` and `/profile.md`.
- `/llms.txt`, a discovery index that links to these resources.
- The home-page introduction, experience metrics, consulting options, availability, and featured project.
- Person metadata and the resume's ProfilePage metadata.
- WebMCP profile, resume, project, and contact responses.

Home-page services, process, and testimonials remain in their existing templates.
WebMCP reads those sections from the home page. Those DOM-specific tools are not registered on the resume page.
The data block and the JSON export contain the same profile. Neither requires a runtime request to the PDF.

## Updating information

1. Update the PDF resume first when skills change.
2. Reconcile `profile.json` with the PDF, including career dates and qualifications.
3. Update `reviewed_on` after checking the sources. Update `modified_on` when the published data changes.
4. Update a page's `modified` frontmatter date when its content changes outside the shared data.
5. Run `npm run build:production` and `npm run test:webmcp` with Node 14.19.0.

The sitemap uses the later of each page's explicit modification date and the shared profile modification date.
It never uses the build time. All builds generate the sitemap and the machine-readable files.
The development watcher regenerates data exports when Panini data changes.

## Hosting and indexing

Deploy all of `dist/`, including the new HTML and data files.
`/resume.html` uses an explicit filename and needs no new rewrite rule.
Keep `/profile.json` served as `application/json`, `/llms.txt` as `text/plain`, and `/profile.md` as `text/markdown` or `text/plain`.
The live server reports nginx. Its active configuration and access logs are not part of this repository.
Do not assume that editing `.htaccess` changes that server's behavior.

The existing wildcard robots rule allows search and AI crawling, except for testimonial photos.
No crawler-specific rules are needed to preserve that policy. Development and staging HTML remain `noindex`.
The production build retains indexing and snippet permissions.

After deployment, verify the canonical URL and HTTP 200 responses for each public resource.
Use Google Search Console and Bing Webmaster Tools to submit the sitemap and inspect indexing.
Those actions require the owner's verified accounts. This implementation does not claim indexing or publication.
Check hosting logs for provider requests and errors. A request with a crawler user-agent name alone does not verify the provider's network access.
If a firewall blocks a provider, follow that provider's current verification and IP-range guidance.

WebMCP serves tools in an open compatible browser page. Search crawlers can use the static HTML independently.
`llms.txt` is optional; it does not require a service to retrieve, rank, or trust the site.

## References

- https://developers.openai.com/api/docs/bots
- https://developers.google.com/search/docs/appearance/ai-features
- https://docs.perplexity.ai/docs/resources/perplexity-crawlers
- https://privacy.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler
- https://llmstxt.org/

## Project catalog

Edit `src/html/data/projects.json` to update project descriptions, contributions, technology evidence, and source links.
The build publishes `/projects.html`, `/projects.json`, and `/projects.md`, and embeds the catalog for WebMCP on every page.
The resume links to the catalog. `llms.txt` and the sitemap include discovery links.
Use repository manifests for framework claims and contribution records for attribution. Do not equate a fork or repository ownership with sole authorship.
Keep unverified licenses and self-reported contributions labeled. Archived projects remain available as historical work.
Update the catalog review date and the `modified` date in `src/html/pages/projects.html` when changing records.
The catalog is a maintained snapshot; the live GitHub tool provides current metadata for the supported accounts.

For project updates, read each README and update its summary. Record the latest default-branch commit returned by the GitHub commits API filtered to author `manifestinteractive`, including the author date and commit link. Do not substitute a repository update timestamp. Keep non-archived projects first and archived projects last, sorting each group newest first. The page groups records with `project-groups.js`. Do not restore excluded projects during refreshes; the curated catalog also limits live GitHub tool results.


When reviewing a project's stack, collect GitHub's complete languages response, package.json, composer.json, Python dependency files, container configuration, and the README.
Record source links and the basis for each selected technology. Group the visible stack and keep its flattened search list consistent.
Keep project types separate from technologies. Match `resume_skills` only to skills already published in the resume.
Treat dependency presence as dependency evidence, not proof of production use or use of a particular AI model.
