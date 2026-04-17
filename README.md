# SamuraiX Arcade

Zero-cost browser arcade for the SamuraiX Discord community.

## What it does

- Hosts a simple landing page on GitHub Pages
- Provides GB/GBC, Nintendo DS, GBA, N64, and PS1 browser launch pages
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

Current emulator keys:

- `gb`
- `nds`
- `gba`
- `n64`
- `psx`

## Why this version is free

- Static site only
- No backend
- No cloud save sync
- No ROM hosting service or user account storage layer

## Important caveats

- Use only legal ROMs or homebrew you are allowed to play
- Some Nintendo DS titles may need extra BIOS/firmware help for best compatibility
- PS1 usually wants a proper BIOS for best compatibility, and none are bundled here
- GameCube and PS2 are not included in this free build yet because browser support is still a rougher tradeoff
- Proper account-linked save sync would require a backend and likely recurring hosting/storage
