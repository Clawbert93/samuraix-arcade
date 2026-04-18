# SamuraiX Arcade

Zero-cost browser arcade for the SamuraiX Discord community.

## What it does

- Hosts a simple landing page on GitHub Pages
- Provides GB/GBC, SNES, Nintendo DS, GBA, N64, PS1, and PSP browser launch pages
- Uses EmulatorJS from its public CDN
- Supports a curated per-emulator dropdown list via `data/game-library.json`
- Does **not** host random ROM packs by default
- Keeps saves local to each user's browser/device

## Current curated games

- GB/GBC: `Castlevania: Circle of the Moon GBC 2.0` from `games/gb/CotM_GBC_2_0.gb`

## How to add more curated games

1. Drop the ROM file into the matching folder under `games/`
2. Add an entry to `data/game-library.json` under the right emulator key
3. Push to GitHub Pages

For large externally hosted assets, you can also use a public HTTPS URL instead of a local repo path.

Example:

```json
{
  "title": "Grand Theft Auto: Liberty City Stories",
  "url": "https://arcade-assets.example.com/psp/Grand_Theft_Auto_Liberty_City_Stories.7z",
  "notes": "Large PSP title hosted outside GitHub Pages to avoid repo bloat and Pages limits."
}
```

Current emulator keys:

- `gb`
- `snes`
- `nds`
- `gba`
- `n64`
- `psx`
- `psp`

## Why this version is free

- Static site only
- No backend
- No cloud save sync
- No ROM hosting service or user account storage layer

## Large game hosting mode

For DS, PS1, and PSP files that are too large for GitHub Pages or normal git comfort, the preferred setup is:

1. Keep the site itself on GitHub Pages
2. Host large archives on object storage or a CDN-backed bucket
3. Point `data/game-library.json` entries at public HTTPS asset URLs via `url`

Recommended storage targets:

- Cloudflare R2
- Backblaze B2
- S3-compatible object storage

Recommended size cleanup before upload:

- PS1 multi-file games -> convert to `.chd` when practical
- PSP `.iso` -> convert to `.cso` when practical

Workspace-local helper for PSP conversion:

- `python3 scripts/convert_psp_asset_to_cso.py <local-path-or-public-url> --output-dir <dir>`
- Uses workspace-local `ciso` + `7z` binaries staged under `.tools/psp_cso/`, so it does not require a system-wide install.

Staging list for the current skipped large files lives in:

- `data/pending-large-assets.json`

Helper script for switching a curated entry over to external hosting:

- `scripts/arcade_set_external_url.py`

Bulk helper for applying the staged external-hosting manifest once a public bucket URL exists:

- `scripts/arcade_apply_pending_external.py`

Cloudflare R2 setup notes for this project:

- `R2_SETUP.md`
- `data/r2-cors.arcade-example.json`

## Cloudflare Pages deploy settings

Because the repo still contains some local game files that are too large for Cloudflare Pages asset limits, deploy Pages from the generated bundle instead of the raw repo root.

Use these settings:

- Framework preset: `None`
- Build command: `python3 scripts/build_cloudflare_pages_bundle.py`
- Build output directory: `dist`
- Root directory: leave blank

The build script copies the site shell, cover art, headers, and only the local game files that fit Cloudflare's static asset limit. Bigger titles should stay on external hosting like R2.

## Same-origin cloud asset delivery

On the Cloudflare deployment, oversized games hosted on R2 are now intended to load through the same arcade origin via `/cloud-assets/...` instead of exposing raw `r2.dev` links directly to the browser runtime. That improves compatibility with stricter browsers, work-managed machines, and the eventual Discord Activity wrapper.

## Important caveats

- Use only legal ROMs or homebrew you are allowed to play
- Some Nintendo DS titles may need extra BIOS/firmware help for best compatibility
- PS1 usually wants a proper BIOS for best compatibility, and none are bundled here
- SNES is included and is another very clean fit for this free browser setup
- PSP is included, but is a heavier browser target and Safari is not a good bet there
- GameCube and PS2 are not included in this free build yet because browser support is still a rougher tradeoff
- Proper account-linked save sync would require a backend and likely recurring hosting/storage
