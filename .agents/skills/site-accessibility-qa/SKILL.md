---
name: site-accessibility-qa
description: Audit peterschmalfeldt.com with Playwright and Axe, including responsive layouts, light and dark themes, keyboard interactions, semantic controls, carousel state, dialogs, focus behavior, and WCAG color contrast. Use when reviewing or changing HTML, Sass, JavaScript interactions, navigation, testimonials, modals, or other visible site behavior.
---

# Site Accessibility QA

Use the checked-in audit runner alongside browser inspection. Automated results are evidence, not a substitute for visually reviewing the rendered site.

## Workflow

1. Read `AGENTS.md` and preserve the user's working tree.
2. Use Node from `.nvmrc` for repository commands.
3. Confirm the development site responds at `http://localhost:8081`, or set `A11Y_BASE_URL` to another target.
4. Run `npm run test:a11y`.
5. Use the configured Playwright MCP server for screenshots and manual keyboard checks at representative desktop and mobile sizes.
6. Rank findings by user impact and identify the affected source files under `src/`.
7. When asked to fix findings, change source files rather than generated `build/`, `dist/`, or `src/assets/css/style.css` output.
8. Re-run the audit, the relevant browser checks, and `npm test` after changes.

## Audit behavior

The script at `scripts/audit.js` checks:

- Axe WCAG 2.0 and 2.1 A/AA rules in desktop light, desktop dark, and mobile light layouts.
- Broken `aria-labelledby` and `aria-describedby` references.
- Non-native testimonial controls and inaccessible carousel pagination.
- Visually hidden testimonial slides that remain exposed to assistive technology.
- Button-styled wrapper spans around links.
- Skip-link semantics and primary landmark placement.
- Mobile-menu keyboard state.
- Calendly dialog focus, Escape behavior, focus restoration, and background isolation.

Treat Axe `incomplete` results as manual-review items. Do not claim that an automated pass proves full WCAG conformance.

## Commands

```bash
npm start
npm run test:a11y
A11Y_BASE_URL=https://peterschmalfeldt.com npm run test:a11y
A11Y_SCREENSHOT_DIR=/tmp/peter-site-a11y npm run test:a11y
```

The audit exits nonzero when automated violations or project-specific semantic failures are found. Set `A11Y_SCREENSHOT_DIR` to save full-page screenshots for every audited viewport and theme. The audit uses the locally installed Google Chrome by default. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` when Chrome lives at a nonstandard path.
