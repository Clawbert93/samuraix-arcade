# SamuraiX Arcade Discord Activity Multiplayer Plan

## Goal

Support this Discord Activity flow:

- Multiple people in the same lounge can each launch their own separate Activity instance and play different games solo.
- If someone joins another person's running instance, they begin as a spectator/watch-only participant.
- The host can explicitly grant controller access, such as P2, P3, or P4.
- Multiplayer-capable games should support shared play up to their supported local player count.

Examples:

- Person 1 launches GoldenEye in their own instance.
- Person 2 launches Smash Bros in a separate instance.
- Person 3 launches a DS game in a third instance.
- Person 4 joins Person 2's Smash instance as a spectator, then gets promoted to P2 by the host.

## Current foundation already in place

The current project already has the right base pieces for this feature:

- `activity.html` + `assets/activity.js` act as the Discord Activity hub.
- `play.html?embedded=1&activity=1` is already the embedded player path.
- Discord SDK connection is already scaffolded in `assets/activity.js`.
- The arcade is already deployed on a Workers host, which is a good place for room APIs and realtime coordination.
- The project already distinguishes browser-first systems like PSP from better in-Discord systems like N64, SNES, GBA, and PS1.

## High-level product decision

### Default behavior

1. A new Activity launch creates a new game instance.
2. The launcher becomes the host.
3. Joiners start as spectators by default.
4. Only the host can grant controller slots.
5. In shared mode, the host controls game selection and session resets.

### Shared-mode rules

- Spectators can watch but cannot control until granted a player slot.
- Controller slots are explicit: `P2`, `P3`, `P4`.
- Host can revoke a slot at any time.
- If the host changes the game, all participants are prompted to resync to the new game.
- Save states, hard resets, and similar emulator-power features should be disabled or host-only in shared sessions.

## Recommended technical architecture

This should be split into two layers.

### Layer 1: room and permissions

Use the Discord Activity `instanceId` as the room identity.

Recommended ownership:

- **Discord instance** = user-facing room identity
- **Cloudflare Worker + Durable Object** = authoritative room state
- **Discord SDK participant list** = live membership signal

Durable Object responsibilities:

- host identity
- selected game/core
- participant roster
- role assignment (`host`, `spectator`, `p2`, `p3`, `p4`)
- room lock state
- ready/sync state
- room events over WebSocket or SSE

### Layer 2: synchronized gameplay

This is the hard part.

Recommended first path:

- use an EmulatorJS-compatible netplay/sync path rather than building a custom input-streaming system from scratch
- treat the Worker room state as the control plane
- treat emulator sync/netplay as the gameplay plane

Recommended implementation direction:

1. Keep the current Activity UI and player UI in this repo.
2. Add a multiplayer room service on Workers.
3. Add or integrate a netplay server for supported emulator cores.
4. Use the room service to decide who is only watching and who gets controller authority.

## Important reality check

This is doable, but it is not a small patch.

The main risk is not the room UI. The main risk is whether the emulator/netplay layer behaves reliably enough for:

- N64 in a Discord webview
- spectator joins
- host-controlled slot assignment
- reconnects and host changes

There is also mixed evidence in EmulatorJS docs/history around netplay maturity, so we should not assume it is production-ready without a spike.

## Recommended MVP target

### Primary target

- **N64 multiplayer first**, because Robbie specifically wants Smash Bros and GoldenEye style room play.

### Safety fallback

- If N64 netplay proves too flaky in Discord embedded mode, prove the architecture with **SNES** first, then bring N64 back once the room/control plane is solid.

### Explicit non-goals for MVP

- PSP multiplayer
- DS multiplayer
- mobile-first multiplayer parity
- cross-room persistence
- save-state sync
- host migration after host disconnects

## Phase plan

## Phase 0: feasibility spike

Goal: prove the hard part before overbuilding the UI.

Deliverables:

1. Confirm Discord Activity instances behave the way we want in the lounge.
   - separate launches can exist independently
   - joining another person's Activity enters their instance
2. Add a tiny room debug panel showing:
   - `instanceId`
   - current participants
   - detected host
3. Stand up a minimal Worker room API backed by a Durable Object.
4. Hardcode one multiplayer test title:
   - `n64 / Super Smash Bros.`
5. Spike synchronized play for:
   - host
   - one spectator
   - promotion to P2
6. Record whether spectator mode truly works or whether we need a fallback.

Exit criteria:

- two people can connect to the same Smash room
- second user starts watch-only
- host can grant P2
- second user can control after promotion
- solo instances in the same lounge still stay separate

If Phase 0 fails on emulator sync reliability, stop and decide whether to:

- pivot to SNES first, or
- change emulator/netplay strategy

## Phase 1: MVP multiplayer room

Goal: ship the first real user-facing version.

Scope:

- N64 only
- curated multiplayer-safe titles only
- 2 players only for first MVP release
- host + spectator + grant P2 flow

User-facing features:

- host launches a multiplayer-capable N64 game
- joiners appear in a room panel
- joiners are spectators by default
- host can click a participant and assign `P2`
- joiner receives live confirmation and controller activation
- host can revoke `P2`
- room shows current game, host, and player slots

UI additions:

### In `activity.html`
- "Multiplayer ready" badges for supported titles
- optional "Join friend's game" affordance when relevant

### In `play.html`
- room panel
- participant list
- host controls
- spectator status banner
- player slot indicator

Technical additions:

- Worker endpoints for room state
- Durable Object room state
- live event transport
- multiplayer mode in `assets/app.js`
- controller slot gating in client logic

Exit criteria:

- stable 2-player Smash session in Discord
- stable spectator-to-P2 promotion
- host changing games forces clear room reset flow

## Phase 2: expand shared play

Goal: make it feel like a real party-room system.

Scope:

- `P3` and `P4`
- more N64 multiplayer games
- optional SNES / GBA expansion after validation
- join requests and clearer host prompts

Features:

- assign `P2`, `P3`, `P4`
- queue/request-to-play UX
- host can lock room to spectators only
- host can kick spectators from the room
- better per-game compatibility messaging

Exit criteria:

- 4-player-capable titles support multiple assigned players when the emulator/core allows it
- role assignment survives reconnects within the same live instance when practical

## Phase 3: polish and system expansion

Goal: broaden support and reduce friction.

Possible additions:

- curated multiplayer compatibility matrix per system/game
- reconnect recovery
- host migration rules
- richer invite/join UX in the hub
- voice/channel-aware presence cues
- browser handoff for systems that are bad in embedded mode

Potential system rollout order:

1. N64
2. SNES
3. GBA
4. PS1
5. DS only after special-case validation
6. PSP only if reality improves significantly

## Data model

Suggested room state shape:

```json
{
  "instanceId": "discord-activity-instance-id",
  "hostUserId": "discord-user-id",
  "mode": "solo|shared",
  "core": "n64",
  "gameId": "super-smash-bros",
  "sessionState": "idle|launching|running|syncing|ended",
  "slots": {
    "p1": "host-user-id",
    "p2": null,
    "p3": null,
    "p4": null
  },
  "participants": {
    "user-a": { "role": "host", "status": "ready" },
    "user-b": { "role": "spectator", "status": "watching" }
  },
  "netplay": {
    "roomId": "abc123",
    "server": "netplay-host",
    "gameHash": "..."
  }
}
```

## Required UI behavior

### Host view

- participant roster
- assign slot buttons
- revoke slot buttons
- room lock toggle
- multiplayer-safe settings panel
- shared-session reset button

### Spectator view

- clear "watch-only" state
- current host and current game
- request-to-play button
- notice when promoted to a controller slot

### Player view

- current player slot label
- input active indicator
- notice if slot revoked

## System support policy

### Strong first candidates

- N64
- SNES
- GBA
- PS1

### Caution

- DS, because touch and stylus behavior are already special

### Not recommended for first multiplayer release

- PSP, because it is already browser-first and fragile in Discord embedded mode

## Edge cases to design early

- host disconnects
- joiner disconnects and rejoins
- host changes game while spectators are present
- someone joins with a mismatched or failed ROM load
- mobile joiners in a room that expects controller-heavy input
- full room behavior when all slots are occupied
- spectator mode if emulator sync layer does not support true passive watch reliably

## Suggested implementation order in code

1. Add room service routes to the Worker.
2. Add a Durable Object for per-instance room state.
3. Extend `assets/activity.js` to show instance and participant info.
4. Extend `play.html` with a room sidebar / panel.
5. Extend `assets/app.js` with multiplayer session state and role-aware control gating.
6. Integrate emulator sync/netplay for one hardcoded N64 title.
7. Generalize to curated multiplayer-safe titles.
8. Add multi-slot assignment and spectator polish.

## Recommendation

Do not begin with a huge broad multiplayer build.

Start with a narrow spike:

- one system
- one title
- one host
- one spectator
- one promotion to P2

If that works cleanly enough in Discord, keep building.
If it does not, pivot before the UI surface gets too large.

## Immediate next action

Build **Phase 0** next:

- room Durable Object
- participant debug panel
- hardcoded Smash test room
- host grant-P2 flow
- real Discord embedded validation with two users
