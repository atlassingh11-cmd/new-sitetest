# iffykhan.ae — deployment notes (build 2026-07-17-U25 — route-card copy condensed to one line per card (homepage only, on top of U24))

## Structure
- `/public` — the ONLY publicly served directory (site HTML, areas guides,
  assets, robots.txt, sitemap.xml, _headers, 404.html).
- Repo root — project files (this file, wrangler.jsonc). Never served.

## How deployment works
Push to GitHub -> the connected Cloudflare project builds and deploys
automatically, reading `wrangler.jsonc` (assets directory: `./public`,
branded 404 via `not_found_handling`). No manual steps.

## Post-deploy verification
- View source of https://iffykhan.ae/ -> `build 2026-07-17-U25`
- Stamps are per-page by design: homepage U25, /projects pages U24, /areas hub U22,
  dubailand + dubai-islands guides U21, all other pages U20
- https://iffykhan.ae/projects -> 200, projects hub (4 cards)
- https://iffykhan.ae/projects/the-meriva-collection -> 200 (clean URLs resolve on
  Cloudflare; they 404 on a local python http.server — that is expected locally)
- https://iffykhan.ae/areas -> 200, hub page
- https://iffykhan.ae/no-such-page -> 404 with branded page
- https://iffykhan.ae/sitemap.xml -> 16 URLs
