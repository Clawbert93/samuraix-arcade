# SamuraiX Arcade Discord Activity setup

## What is already prepared

- `activity.html` provides an Activity-friendly landing shell.
- `assets/activity.js` can initialize the Discord Embedded App SDK once a real Discord application client ID is provided.
- `play.html?embedded=1` is the intended launch shape for Activity-mode players.
- Cloud games are now proxied through the arcade origin using `/cloud-assets/...`, which is the right foundation for Discord embedding.

## Next manual steps in Discord

1. Create or choose a Discord application in the Discord Developer Portal.
2. Enable Activities / Embedded App for that application.
3. In `Activities -> Settings`, turn Activities on and enable the supported platforms you want.
4. In `Activities -> URL Mappings`, set the root entry point to:
   - `/` -> `<arcade-domain>/activity.html`
5. Also add:
   - `/emu` -> `cdn.emulatorjs.org`
   - `/esm` -> `esm.sh`

## Recommended custom domain

Use a stable branded subdomain instead of `workers.dev` for the Activity host.
Suggested shape:

- `arcade.samuraix.ai`

## Recommended next implementation steps

1. Attach custom domain on Cloudflare.
2. Point the root Activity URL mapping at `/activity.html` on the arcade host.
3. Add the `/emu` and `/esm` URL mappings in the Discord app.
4. Replace placeholder links/buttons in `activity.html` with richer presence-aware launch cards.
5. Add party-room state (who launched what, featured game cards, invite button, session-ready fullscreen/popup guidance).

## Important reality check

Discord Activities run inside an iframe/webview. Large PSP titles will still be heavier than classic systems, especially on mobile. The current fullscreen button plus browser popout button are intentional escape hatches for when the embedded view is not enough.
