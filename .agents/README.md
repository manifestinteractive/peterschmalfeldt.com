# Local Codex Skills

This repository stores repo-specific Codex skills in `.agents/skills/`.

Current skills:

- `peter-site-copy` for website copy, SEO language, CTAs, positioning, and tone updates for peterschmalfeldt.com
- `site-accessibility-qa` for Playwright and Axe audits, keyboard checks, responsive verification, carousel semantics, and dialog behavior

Notes:

- Codex scans `.agents/skills` automatically for repo-local skills.
- Codex MCP servers are configured in `.codex/config.toml`; compatible VS Code agent clients use `.vscode/mcp.json`.
- If a new skill does not appear in the VS Code extension right away, reload the window or restart Codex.
- In Codex, use `/skills` or type `$` and select the skill by name.
