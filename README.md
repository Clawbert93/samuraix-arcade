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

Staging list for the current skipped large files lives in:

- `data/pending-large-assets.json`

Helper script for switching a curated entry over to external hosting:

- `scripts/arcade_set_external_url.py`

## Important caveats

- Use only legal ROMs or homebrew you are allowed to play
- Some Nintendo DS titles may need extra BIOS/firmware help for best compatibility
- PS1 usually wants a proper BIOS for best compatibility, and none are bundled here
- SNES is included and is another very clean fit for this free browser setup
- PSP is included, but is a heavier browser target and Safari is not a good bet there
- GameCube and PS2 are not included in this free build yet because browser support is still a rougher tradeoff
- Proper account-linked save sync would require a backend and likely recurring hosting/storage
