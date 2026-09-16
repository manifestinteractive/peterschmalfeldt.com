# WebMCP experiment

Reviewed on September 15, 2026. The implementation is in `src/js/webmcp.js`.
The existing Gulp task includes it in the site's application bundle.

## Site evaluation

The home page supports questions about consulting, engineering services, working methods, and engagement options.
Its testimonials provide attributed recommendations. Its prototype section provides a concrete example with a video and repository.
The public resume adds employment history, selected skills, certifications, and education.
GitHub provides public project metadata. LinkedIn blocked automated reading during this review, so the experiment returns its profile link only.

The concept in `plan-webmcp.md` informed the tool boundaries. The implementation corrects its broad metric selectors,
biography selector, missing service descriptions, missing engagement results, and missing testimonial authors.
It reads final metric values from data attributes to avoid returning intermediate counter values.

## Tools

| Tool                       | Content and limits                                                                                    |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `get_profile`              | Existing biography, structured skill areas, four experience metrics, and professional links.          |
| `list_services`            | Full descriptions and optional category: `all`, `consulting`, `services`, `process`, or `engagement`. |
| `list_testimonials`        | Up to 10 attributed quotes, including inactive slides.                                                |
| `get_prototype_showcase`   | Existing explanation, video and repository links, and demonstration limitations.                      |
| `get_contact_options`      | Email and Calendly links, consulting options, and published availability.                             |
| `get_resume`               | Shared HTML resume data, complete skill groups, a review date, and the PDF source URL.                                    |
| `list_github_repositories` | Live public repository metadata for `manifestinteractive` and the four supported organizations, with pagination and fork/archive labels.   |

Every tool is read-only. Contact tools return links without opening an email client or submitting a booking.
The page does not expose live appointment slots, consulting rates, a video transcript, private repositories, or LinkedIn content.
Repository metadata does not prove authorship of every contribution or demonstrate code quality.
The tool does not fetch repository source files or README content.

The resume reads `src/html/data/profile.json`, the same data used for the HTML resume and exported profiles.
The PDF resume remains the source of truth for skills. Reconcile the shared data and review date when that PDF changes.
An employment entry with `end: null` means current on that review date.
The services and testimonial tools read the current home-page DOM. Shared profile, project, and contact tools read the embedded profile data.
The resume and project pages register seven tools; home-page services and testimonials are available only on the home page.
See [Profile publishing](profile-publishing.md) for the data update and indexing workflow.

## API and browser behavior

The implementation prefers `document.modelContext.registerTool` from the current draft.
It falls back to `navigator.modelContext.registerTool` for earlier browser implementations.
Unsupported browsers skip registration. Registration failures are caught per tool.
There is no polyfill, remote MCP server, chat widget, API key, or new dependency.
Tools exist in the open page; this is not a server endpoint for arbitrary MCP clients.

Tool results use a JSON-encoded text content block. Input schemas and runtime checks reject invalid arguments.
GitHub requests use an allowlist of five accounts and a fixed endpoint, omit credentials, and have an eight-second timeout.
They only run when that tool is called. Requests support cancellation and return explicit failure results.
GitHub rate limits and network failures do not produce fabricated repository lists.
Testimonials and GitHub results have `untrustedContentHint` annotations.

## Verification

Use Node 14.19.0 from `.nvmrc`:

```sh
npm run build:dev
npm run test:webmcp
```

The test uses installed Chrome and Playwright to load the built site with mocked WebMCP registration.
It verifies both API locations, unsupported browsers, registration failures, every tool's output,
input validation, GitHub pagination, rate limits, network failure, timeouts, and cancellation before and during a request.
External requests are blocked or mocked. This test does not prove native agent discovery or live GitHub connectivity.

For native testing, use a browser with WebMCP enabled and run `npm start`.
Chrome's documentation describes `about:flags#enable-webmcp-testing` for local testing.
Browser support and origin trial requirements can change; consult the linked documentation.
With the current draft API, inspect tools in the page console:

```js
const tools = await document.modelContext.getTools();
const profile = tools.find((tool) => tool.name === "get_profile");
JSON.parse(await document.modelContext.executeTool(profile, {}));
```

Test agent questions such as "What consulting options does Peter offer?" and "What does his resume say about his employment?"
Check that answers cite returned sources and respect their coverage limits.

## Sources

- [WebMCP specification](https://webmachinelearning.github.io/webmcp/)
- [WebMCP repository](https://github.com/webmachinelearning/webmcp)
- [Browser implementation status](https://github.com/webmachinelearning/webmcp/blob/main/implementation-status.md)
- [Chrome WebMCP documentation](https://developer.chrome.com/docs/ai/webmcp)
- [GitHub repository API](https://docs.github.com/en/rest/repos/repos#list-repositories-for-a-user)
- [Peter's website](https://peterschmalfeldt.com/)
- [Public resume](https://resume.peterschmalfeldt.com/)
- [Public GitHub profile](https://github.com/manifestinteractive)

## Project catalog

`src/html/data/projects.json` supplies `/projects.html`, `/projects.json`, `/projects.md`, and embedded WebMCP data on every page.
`search_projects` supports text and technology filters with pagination. `get_project` accepts the stable ID returned by search.
Technology filters ignore punctuation and case, so `NextJS` matches `Next.js`.
This is a reviewed snapshot, not a live repository scan. It includes personal non-fork repositories,
repositories from FindByColor, PoliceScorecard, sfccdevops, and opensfcc, with the exclusions requested by Peter.
Public repositories without a verified license must not automatically be described as open source.
Root package manifests support framework claims; repository language alone does not establish a framework.
Peter identified manifestinteractive as his contribution account. Linked commits establish contributions, not sole authorship.
This does not change the resume's authority for skills. Update project records and their review date as evidence changes.

Project summaries are reviewed paraphrases of repository READMEs. Each record includes its README link and latest public default-branch commit by manifestinteractive. The author date supplies Last Contribution. Sort each archive group by that date, newest first. The HTML page omits attribution bookkeeping; source evidence remains in structured data. The live GitHub tool filters results to catalog IDs so excluded projects do not return through that tool. Pagination follows GitHub API pages and can include an empty filtered page.


### Technology and project type queries

The catalog stores all GitHub language names in `github_languages`, including small languages omitted from the GitHub UI's main bar.
`technology_groups` organizes languages, frameworks/libraries, AI/data, and tools/platforms. `technologies` is the searchable flattened list.
`technology_evidence` records the source and basis for each technology, distinguishing GitHub languages, declared dependencies, container configuration, and README documentation.
`resume_skills` matches existing resume terminology without adding skills to the resume. A match is project evidence, not a new proficiency claim.
Node.js in a frontend project can describe build tooling rather than its deployed server.
The catalog uses selected substantive dependencies, not every transitive or utility package. An SDK dependency does not establish which models were used.
Search accepts `project_type` (for example `CLI`) and searches technologies in `query`. Combine `technology: "Python"` and `query: "Streamlit"` for a cross-filter.
A missing match means no supporting catalog entry was found, not that Peter lacks that experience.
