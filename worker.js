const R2_PUBLIC_BASE_URL = 'https://pub-2c5587529e4249efbcf882d5d3697d95.r2.dev';
const ROOM_STALE_MS = 1000 * 60 * 15;
const DEFAULT_NETPLAY_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...extraHeaders,
    },
  });
}

function normalizeRoomId(rawValue) {
  return String(rawValue || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9:_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160);
}

function joinTargetUrl(pathname, search, env) {
  const base = String(env.R2_PUBLIC_BASE_URL || R2_PUBLIC_BASE_URL || '').replace(/\/$/, '');
  const suffix = pathname.replace(/^\/cloud-assets(?:-v\d+)?/, '');
  return `${base}${suffix}${search || ''}`;
}

function makeProxyHeaders(request) {
  const headers = new Headers();
  for (const name of ['range', 'if-none-match', 'if-modified-since', 'accept']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  return headers;
}

async function proxyCloudAsset(request, env) {
  const url = new URL(request.url);
  if (!/^\/cloud-assets(?:-v\d+)?\//.test(url.pathname)) {
    return new Response('Missing cloud asset path.', { status: 400 });
  }

  const isRangeRequest = request.headers.has('range');
  const fetchOptions = {
    method: request.method,
    headers: makeProxyHeaders(request),
    redirect: 'follow',
  };

  const upstream = await fetch(joinTargetUrl(url.pathname, url.search, env), fetchOptions);

  const headers = new Headers(upstream.headers);
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  headers.set('Accept-Ranges', headers.get('Accept-Ranges') || 'bytes');
  if (!isRangeRequest && upstream.status >= 200 && upstream.status < 300) {
    headers.set('Cache-Control', headers.get('Cache-Control') || 'public, max-age=86400');
    headers.set('CDN-Cache-Control', 'public, max-age=86400');
  }
  headers.delete('Access-Control-Allow-Origin');
  headers.delete('Access-Control-Expose-Headers');

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

function readNetplayIceServers(env) {
  const raw = String(env.NETPLAY_ICE_SERVERS_JSON || '').trim();
  if (!raw) return DEFAULT_NETPLAY_ICE_SERVERS;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_NETPLAY_ICE_SERVERS;
  } catch (error) {
    return DEFAULT_NETPLAY_ICE_SERVERS;
  }
}

function runtimeConfig(env) {
  return {
    netplay: {
      server: String(env.NETPLAY_SERVER_URL || '').trim(),
      iceServers: readNetplayIceServers(env),
    },
  };
}

function defaultRoomState(roomId) {
  return {
    roomId,
    instanceId: roomId,
    hostClientId: null,
    mode: 'shared',
    core: null,
    gameId: null,
    gameTitle: null,
    launched: false,
    lastUpdatedAt: 0,
    slots: {
      p1: null,
      p2: null,
      p3: null,
      p4: null,
    },
    members: {},
    participantSnapshot: [],
  };
}

function pickDisplayName(rawName, fallbackId) {
  const cleaned = String(rawName || '').trim();
  if (cleaned) return cleaned.slice(0, 80);
  return `Player ${String(fallbackId || '').slice(-4) || 'guest'}`;
}

function sanitizeParticipant(participant) {
  if (!participant || typeof participant !== 'object') return null;
  const id = String(participant.id || participant.userId || participant.user_id || participant.clientId || '').trim();
  const displayName = pickDisplayName(
    participant.displayName || participant.global_name || participant.globalName || participant.username || participant.nick || participant.name,
    id,
  );
  if (!id && !displayName) return null;
  return {
    id: id || `snapshot-${displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    displayName,
  };
}

export class ArcadeRoom {
  constructor(state) {
    this.state = state;
    this.room = null;
    this.loaded = false;
  }

  async ensureLoaded() {
    if (this.loaded) return;
    this.room = (await this.state.storage.get('room')) || defaultRoomState(this.state.id.toString());
    this.loaded = true;
    await this.pruneStaleMembers();
  }

  async save() {
    this.room.lastUpdatedAt = Date.now();
    await this.state.storage.put('room', this.room);
  }

  async pruneStaleMembers() {
    const now = Date.now();
    let changed = false;
    for (const [clientId, member] of Object.entries(this.room.members || {})) {
      if (!member || now - Number(member.lastSeenAt || 0) <= ROOM_STALE_MS) continue;
      delete this.room.members[clientId];
      for (const slot of ['p1', 'p2', 'p3', 'p4']) {
        if (this.room.slots[slot] === clientId) this.room.slots[slot] = null;
      }
      changed = true;
    }
    if (this.room.hostClientId && !this.room.members[this.room.hostClientId]) {
      const fallbackHost = Object.keys(this.room.members)[0] || null;
      this.room.hostClientId = fallbackHost;
      this.room.slots.p1 = fallbackHost;
      changed = true;
      if (fallbackHost && this.room.members[fallbackHost]) {
        this.room.members[fallbackHost].role = 'host';
        this.room.members[fallbackHost].playerSlot = 'p1';
      }
    }
    if (changed) await this.save();
  }

  clearMemberSlots(targetId) {
    for (const slot of ['p1', 'p2', 'p3', 'p4']) {
      if (this.room.slots[slot] === targetId) this.room.slots[slot] = null;
    }
  }

  promoteHostIfNeeded(clientId) {
    if (this.room.hostClientId) return;
    this.room.hostClientId = clientId;
    this.room.slots.p1 = clientId;
    if (this.room.members[clientId]) {
      this.room.members[clientId].role = 'host';
      this.room.members[clientId].playerSlot = 'p1';
    }
  }

  mergeParticipantSnapshot(input) {
    const snapshots = Array.isArray(input)
      ? input.map((entry) => sanitizeParticipant(entry)).filter(Boolean)
      : [];
    if (snapshots.length) {
      this.room.participantSnapshot = snapshots;
    }
  }

  publicState(viewerId = null) {
    const members = Object.values(this.room.members || {})
      .map((member) => ({
        clientId: member.clientId,
        displayName: member.displayName,
        role: member.role || 'spectator',
        playerSlot: member.playerSlot || null,
        requestedSlot: member.requestedSlot || null,
        launched: member.launched === true,
        lastSeenAt: member.lastSeenAt || 0,
        isHost: member.clientId === this.room.hostClientId,
      }))
      .sort((a, b) => Number(b.lastSeenAt || 0) - Number(a.lastSeenAt || 0));

    return {
      roomId: this.room.roomId,
      instanceId: this.room.instanceId,
      mode: this.room.mode,
      hostClientId: this.room.hostClientId,
      core: this.room.core,
      gameId: this.room.gameId,
      gameTitle: this.room.gameTitle,
      launched: this.room.launched === true,
      slots: this.room.slots,
      members,
      participantSnapshot: this.room.participantSnapshot || [],
      viewerId,
      viewer: viewerId ? (this.room.members[viewerId] || null) : null,
      lastUpdatedAt: this.room.lastUpdatedAt || 0,
    };
  }

  async handleSync(body) {
    const clientId = normalizeRoomId(body?.clientId) || `guest-${crypto.randomUUID().slice(0, 8)}`;
    const displayName = pickDisplayName(body?.displayName, clientId);
    const now = Date.now();

    if (!this.room.members[clientId]) {
      this.room.members[clientId] = {
        clientId,
        displayName,
        role: 'spectator',
        playerSlot: null,
        requestedSlot: null,
        launched: false,
        lastSeenAt: now,
      };
    }

    const member = this.room.members[clientId];
    member.displayName = displayName;
    member.lastSeenAt = now;
    member.launched = body?.launched === true;

    if (typeof body?.instanceId === 'string' && body.instanceId.trim()) {
      this.room.instanceId = body.instanceId.trim();
    }

    if (typeof body?.core === 'string' && body.core.trim()) {
      this.room.core = body.core.trim();
    }

    this.promoteHostIfNeeded(clientId);

    if (clientId === this.room.hostClientId) {
      member.role = 'host';
      member.playerSlot = 'p1';
      this.room.slots.p1 = clientId;
      if (typeof body?.gameId === 'string') this.room.gameId = body.gameId || null;
      if (typeof body?.gameTitle === 'string') this.room.gameTitle = body.gameTitle || null;
      if (typeof body?.launched === 'boolean') this.room.launched = body.launched;
    } else if (member.playerSlot && this.room.slots[member.playerSlot] !== clientId) {
      member.playerSlot = null;
      member.role = 'spectator';
    }

    this.mergeParticipantSnapshot(body?.participants);
    await this.save();
    return this.publicState(clientId);
  }

  async handleAssign(body) {
    const actorId = normalizeRoomId(body?.actorId);
    const targetId = normalizeRoomId(body?.targetId);
    const slot = String(body?.slot || '').trim().toLowerCase();

    if (!actorId || actorId !== this.room.hostClientId) {
      return json({ error: 'Only the host can assign slots.' }, 403);
    }
    if (!targetId || !this.room.members[targetId]) {
      return json({ error: 'Target player is not in the room.' }, 404);
    }

    if (slot === 'spectator' || slot === 'none' || slot === '') {
      this.clearMemberSlots(targetId);
      this.room.members[targetId].playerSlot = null;
      this.room.members[targetId].role = 'spectator';
      this.room.members[targetId].requestedSlot = null;
      await this.save();
      return json(this.publicState(actorId));
    }

    if (!['p2', 'p3', 'p4'].includes(slot)) {
      return json({ error: 'Only p2, p3, or p4 are assignable in this phase.' }, 400);
    }

    const occupiedBy = this.room.slots[slot];
    if (occupiedBy && occupiedBy !== targetId && this.room.members[occupiedBy]) {
      this.room.members[occupiedBy].playerSlot = null;
      this.room.members[occupiedBy].role = 'spectator';
    }

    this.clearMemberSlots(targetId);
    this.room.slots[slot] = targetId;
    this.room.members[targetId].playerSlot = slot;
    this.room.members[targetId].role = 'player';
    this.room.members[targetId].requestedSlot = null;
    await this.save();
    return json(this.publicState(actorId));
  }

  async handleRequestSeat(body) {
    const clientId = normalizeRoomId(body?.clientId);
    const slot = String(body?.slot || 'p2').trim().toLowerCase();
    if (!clientId || !this.room.members[clientId]) {
      return json({ error: 'Viewer is not in the room yet.' }, 404);
    }
    if (!['p2', 'p3', 'p4'].includes(slot)) {
      return json({ error: 'Only p2, p3, or p4 can be requested.' }, 400);
    }
    this.room.members[clientId].requestedSlot = slot;
    await this.save();
    return json(this.publicState(clientId));
  }

  async fetch(request) {
    await this.ensureLoaded();
    const url = new URL(request.url);
    const pathRoomId = normalizeRoomId(url.pathname.split('/')[3]);
    if (pathRoomId && (!this.room.roomId || this.room.roomId === this.state.id.toString())) {
      this.room.roomId = pathRoomId;
      if (!this.room.instanceId) this.room.instanceId = pathRoomId;
      await this.save();
    }
    await this.pruneStaleMembers();

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'GET,POST,OPTIONS',
          'access-control-allow-headers': 'content-type',
          'cache-control': 'no-store',
        },
      });
    }

    const pathname = url.pathname.replace(/\/$/, '');
    const readQueryBody = () => {
      let participants = [];
      try {
        const rawParticipants = String(url.searchParams.get('participants') || '').trim();
        if (rawParticipants) participants = JSON.parse(rawParticipants);
      } catch (error) {}
      return {
        actorId: url.searchParams.get('actorId') || '',
        targetId: url.searchParams.get('targetId') || '',
        clientId: url.searchParams.get('clientId') || '',
        displayName: url.searchParams.get('displayName') || '',
        instanceId: url.searchParams.get('instanceId') || '',
        core: url.searchParams.get('core') || '',
        gameId: url.searchParams.get('gameId') || '',
        gameTitle: url.searchParams.get('gameTitle') || '',
        slot: url.searchParams.get('slot') || '',
        reason: url.searchParams.get('reason') || '',
        launched: ['1', 'true', 'yes'].includes(String(url.searchParams.get('launched') || '').trim().toLowerCase()),
        participants,
      };
    };

    if (request.method === 'GET' && pathname.endsWith('/sync')) {
      return json(await this.handleSync(readQueryBody()), 200, { 'access-control-allow-origin': '*' });
    }
    if (request.method === 'GET' && pathname.endsWith('/assign-slot')) {
      const response = await this.handleAssign(readQueryBody());
      response.headers.set('access-control-allow-origin', '*');
      return response;
    }
    if (request.method === 'GET' && pathname.endsWith('/request-seat')) {
      const response = await this.handleRequestSeat(readQueryBody());
      response.headers.set('access-control-allow-origin', '*');
      return response;
    }
    if (request.method === 'GET') {
      return json(this.publicState(url.searchParams.get('viewerId') || null), 200, { 'access-control-allow-origin': '*' });
    }

    let body = {};
    try {
      body = await request.json();
    } catch (error) {
      return json({ error: 'Expected JSON request body.' }, 400, { 'access-control-allow-origin': '*' });
    }

    if (pathname.endsWith('/sync')) {
      return json(await this.handleSync(body), 200, { 'access-control-allow-origin': '*' });
    }
    if (pathname.endsWith('/assign-slot')) {
      const response = await this.handleAssign(body);
      response.headers.set('access-control-allow-origin', '*');
      return response;
    }
    if (pathname.endsWith('/request-seat')) {
      const response = await this.handleRequestSeat(body);
      response.headers.set('access-control-allow-origin', '*');
      return response;
    }

    return json({ error: 'Unknown room action.' }, 404, { 'access-control-allow-origin': '*' });
  }
}

function routeRoomRequest(request, env, roomId) {
  if (!env.MULTIPLAYER_ROOMS) {
    return json({ error: 'Room Durable Object binding is missing.' }, 500);
  }
  const normalizedRoomId = normalizeRoomId(roomId);
  if (!normalizedRoomId) {
    return json({ error: 'Missing room id.' }, 400);
  }
  const id = env.MULTIPLAYER_ROOMS.idFromName(normalizedRoomId);
  const stub = env.MULTIPLAYER_ROOMS.get(id);
  return stub.fetch(request);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/runtime-config') {
      return json(runtimeConfig(env));
    }

    if (/^\/api\/rooms\//.test(url.pathname)) {
      const [, , , roomId] = url.pathname.split('/');
      return routeRoomRequest(request, env, roomId);
    }

    if (/^\/cloud-assets(?:-v\d+)?\//.test(url.pathname)) {
      return proxyCloudAsset(request, env);
    }

    if (url.pathname === '/') {
      const rewritten = new URL('/activity.html', url);
      return env.ASSETS.fetch(new Request(rewritten, request));
    }

    if (url.pathname === '/activity') {
      const rewritten = new URL('/activity.html', url);
      rewritten.search = url.search;
      return env.ASSETS.fetch(new Request(rewritten, request));
    }

    if (url.pathname === '/play') {
      const rewritten = new URL('/play.html', url);
      rewritten.search = url.search;
      return env.ASSETS.fetch(new Request(rewritten, request));
    }

    if (url.pathname === '/psp-debug') {
      const rewritten = new URL('/psp-debug.html', url);
      rewritten.search = url.search;
      return env.ASSETS.fetch(new Request(rewritten, request));
    }

    if (url.pathname === '/arcade') {
      return Response.redirect(new URL('/index.html', url), 302);
    }

    return env.ASSETS.fetch(request);
  },
};
