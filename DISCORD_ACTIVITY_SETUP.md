# SamuraiX Arcade Discord Activity setup

## What is already prepared

- `activity.html` is now a real Activity-friendly game hub, not just a placeholder shell.
- `assets/activity.js` loads the curated library into featured launch lanes, system shelves, and browser-first PSP recommendations.
- `play.html?embedded=1&activity=1` is the intended launch shape for Activity-mode players.
- Embedded player mode now includes a lightweight top nav so people can jump back to the Discord hub or switch systems without feeling stranded.
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

1. Attach custom domain on Cloudflare if Robbie wants a cleaner public host later.
2. Point the root Activity URL mapping at `/activity.html` on the arcade host.
3. Add the `/emu` and `/esm` URL mappings in the Discord app.
4. Deploy the latest Worker build so the richer hub is live.
5. After that, add optional party-room state like who launched what, invite affordances, and richer session/presence behavior.

## Fast deploy note

The repo includes a simple live deploy helper now:

```bash
cd /home/robert/OpenClawProjects/samuraix-arcade
npx wrangler login
npm run deploy:cf
```

That script rebuilds `dist/` and runs `npx wrangler deploy`.

If you prefer token-based auth, it will also use `CLOUDFLARE_API_TOKEN` when that variable is set.

## Important reality check

Discord Activities run inside an iframe/webview. GB/GBC, SNES, GBA, N64, and PS1 are the best default lane for the Activity hub. DS stays visible, but touch-heavy DS play is still best on desktop with a mouse. PSP remains browser-first and should stay framed that way in the hub.
