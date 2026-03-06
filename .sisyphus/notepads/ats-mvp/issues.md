# Issues

- 2026-03-05: Chrome DevTools MCP `evaluate_script` occasionally times out on heavy DOM mutation scenarios; Playwright checks are more reliable for this session.
- 2026-03-05: Browser console shows non-blocking warnings/errors: Tailwind CDN production warning and missing `favicon.ico` 404.
- 2026-03-05: Environment is not a git repository, so worktree management is degraded to project root path in `.sisyphus/boulder.json`.
- 2026-03-05: Playwright's `dragTo` does not reliably trigger Sortable.js drag animations; button-based reordering is easier to verify via Playwright. Code review confirms handle-only drag implementation is correct.
