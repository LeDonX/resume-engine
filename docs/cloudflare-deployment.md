# Cloudflare deployment

This project is configured for direct deployment to Cloudflare Workers static assets via Wrangler.

Wrangler is configured to upload prebuilt static assets from `dist-static/`. The npm Cloudflare scripts run the Vite build first and then invoke Wrangler.

## Requirements

- Node.js 20+
- A logged-in Cloudflare Wrangler session or a valid API token

## Commands

```bash
npm install
npm run build
npm run preview:cloudflare
npm run deploy:cloudflare
```

## Build output

- Static output directory: `dist-static/`
- Cloudflare assets directory: `dist-static/`

## Notes

- The project is a static multi-page Vite app.
- Public routes include `/` and `/简历.html`.
