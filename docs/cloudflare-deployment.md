# Cloudflare deployment

This project is configured for Cloudflare Pages deployment.

The repository includes a Pages-compatible `wrangler.jsonc` with `pages_build_output_dir` set to `dist-static/`. That lets Cloudflare Pages Git deployments read the correct output directory directly from the repo.

## Requirements

- Node.js 20+
- A logged-in Cloudflare Wrangler session or a valid API token for direct CLI deploys

## Commands

```bash
npm install
npm run build
npm run preview:cloudflare
npm run deploy:cloudflare
```

## Cloudflare Pages dashboard

If you deploy through Git integration in Cloudflare Pages:

- Build command: `npm run build`
- Build output directory: `dist-static`

After this change, Pages can also read the same output directory from `wrangler.jsonc`.

## Build output

- Static output directory: `dist-static/`
- Cloudflare Pages build output directory: `dist-static/`

## Notes

- The project is a static multi-page Vite app.
- Public routes include `/` and `/简历.html`.
- The previous Workers-only `assets` config was removed because Cloudflare Pages expects `pages_build_output_dir` instead.
