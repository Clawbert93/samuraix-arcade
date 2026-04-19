# SamuraiX Arcade Netplay Setup

This is the Phase 0 netplay path for the Discord Activity multiplayer test.

## What is wired now

The player can now auto-configure EmulatorJS netplay for the hardcoded Phase 0 target:

- system: `n64`
- game: `Super Smash Bros.`
- room identity: derived from the Discord Activity instance / shared room id
- shared `EJS_gameID`: derived from `core + game + room`

The room panel and host/spectator controls live in the Worker/Durable Object layer.
The actual synchronized emulator session still depends on a working EmulatorJS netplay server.

## Required runtime config

The Worker now exposes `/api/runtime-config` and reads these Wrangler vars:

- `NETPLAY_SERVER_URL`
- `NETPLAY_ICE_SERVERS_JSON`

Current live value on this machine:

- `NETPLAY_SERVER_URL`: `https://venus.tail69e201.ts.net:8443#`
- `NETPLAY_ICE_SERVERS_JSON`: STUN-only starter list

If `NETPLAY_SERVER_URL` is blank, the room UI still works, but real synchronized gameplay is not active yet.

## How to stand up the netplay server

Use the upstream EmulatorJS netplay server:

```bash
git clone https://github.com/EmulatorJS/EmulatorJS-Netplay
cd EmulatorJS-Netplay
npm install express socket.io cors
node server.js
```

Default local port is `3000`.

## Recommended production shape

Run the netplay server on a stable hostname, for example:

- `https://netplay.samuraix-arcade.roberteverland22.workers.dev` is **not** enough by itself unless it is actually backed by a compatible long-lived netplay service
- better shape: a small Node host or VPS, fronted by a real hostname

Current machine-hosted stopgap target:

- `https://venus.tail69e201.ts.net:8443#`

Longer-term cleaner target:

- `https://netplay.samuraixarcade.example`

## Configure Wrangler

Set the Worker vars before deploy.

Example values:

```json
{
  "NETPLAY_SERVER_URL": "https://your-netplay-host:3000#",
  "NETPLAY_ICE_SERVERS_JSON": "[{\"urls\":\"stun:stun.l.google.com:19302\"},{\"urls\":\"stun:stun1.l.google.com:19302\"},{\"urls\":\"stun:stun2.l.google.com:19302\"}]"
}
```

Notes:

- EmulatorJS docs currently show the netplay server value with a trailing `#`, so keep that shape unless real testing proves otherwise.
- STUN-only may work on friendly networks, but real public use may need TURN.

## Phase 0 test flow

1. Deploy the arcade Worker with a real `NETPLAY_SERVER_URL`.
2. Launch the Discord Activity.
3. Open the **Multiplayer lab** Smash test.
4. User A becomes host automatically.
5. User B joins the same Activity instance.
6. User B should see the same shared game selected through room sync.
7. Host grants `P2`.
8. Verify whether EmulatorJS netplay actually syncs control cleanly.

## Honest caveat

This repo now has:

- room control plane
- shared game selection sync
- netplay config plumbing

It does **not** prove that EmulatorJS netplay is fully reliable in Discord embedded mode yet.
That still needs a real two-user validation pass.
