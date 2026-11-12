# Public Coin Zones sharing

The existing `dashboards.mbzazad.workers.dev/coin-zones/` stays behind Cloudflare Access.

A separate Worker, `coin-zones-public`, serves the same generated `public/` board files without authentication at:
https://coin-zones-public.mbzazad.workers.dev/#GOLD-scen

This URL is **not live until the deployment workflow has run successfully**.

The public Worker has an explicit static-file allowlist, blocks `/api/*` and all non-GET/HEAD requests, and never receives the GitHub token. Its HTML swaps the private refresh UI script for a public freshness notice. All published data, including the paper P&L file, is visible to anyone with the link. Do not put private data into `public/`.

The public Worker is deployed from the same GitHub build workflow after the private Worker. To disable public sharing, disable the `coin-zones-public` workers.dev route in Cloudflare, or remove its deployment step and delete the public Worker.

Check the public URL in an incognito browser (no Access prompt), verify coin navigation and `#GOLD-scen`, confirm POST `/api/refresh` fails, and confirm the existing private URL still requires login.
