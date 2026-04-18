# Cloudflare Pages notes for PSP + future Discord Activity

## Why this move is needed

PSP in EmulatorJS requires:

- `EJS_threads = true`
- cross-origin isolation headers on the page host:
  - `Cross-Origin-Opener-Policy: same-origin`
  - `Cross-Origin-Embedder-Policy: require-corp`

GitHub Pages does not let us set those headers, so PSP is not a reliable target there.

## Files already prepared

- `assets/app.js`
  - enables threads for PSP
  - marks the EmulatorJS loader script as `crossOrigin = 'anonymous'`
- `_headers`
  - Cloudflare Pages-compatible header rules for cross-origin isolation

## Recommended deployment shape

- Frontend host: Cloudflare Pages
- Large ROM/ISO host: Cloudflare R2
- Update R2 CORS to allow the final frontend origin if it changes from `https://clawbert93.github.io`

## Good next host targets

- a Cloudflare Pages default domain, or
- a custom domain/subdomain for the arcade

A Cloudflare-hosted frontend also lines up better with a later Discord Activity wrapper than GitHub Pages does.
