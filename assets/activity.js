const DEFAULT_DISCORD_CLIENT_ID = '1494677350439452733';
const ACTIVITY_REV = 'restore5am9';
const statusEl = document.getElementById('activityStatus');
const discordDetectedEl = document.getElementById('discordDetected');
const discordAuthStateEl = document.getElementById('discordAuthState');
const activityInstanceIdEl = document.getElementById('activityInstanceId');
const activityParticipantCountEl = document.getElementById('activityParticipantCount');
const libraryStatsEl = document.getElementById('libraryStats');
const featuredLaunchesEl = document.getElementById('featuredLaunches');
const systemShelfGridEl = document.getElementById('systemShelfGrid');
const activityBestBetsEl = document.getElementById('activityBestBets');
const browserFirstLaneEl = document.getElementById('browserFirstLane');
const multiplayerLabEl = document.getElementById('multiplayerLab');
const activityShellEl = document.querySelector('main.activity-shell');

const activityState = {
  insideDiscord: false,
  clientId: DEFAULT_DISCORD_CLIENT_ID,
  discordSdk: null,
  instanceId: '',
  participants: [],
};
let latestLibrary = null;
let activityPlayerOverlayEl = null;

const SYSTEM_META = {
  gb: { label: 'GB/GBC', tone: 'Very clean Activity fit', browserFirst: false },
  snes: { label: 'SNES', tone: 'Great in Discord', browserFirst: false },
  gba: { label: 'GBA', tone: 'Fast and phone-friendly', browserFirst: false },
  nds: { label: 'DS', tone: 'Best on desktop for touch-heavy games', browserFirst: false, warning: 'Touchscreen-heavy DS games are still better on desktop with a mouse.' },
  n64: { label: 'N64', tone: 'Solid for casual room play', browserFirst: false },
  psx: { label: 'PS1', tone: 'Strong embedded pick', browserFirst: false },
  psp: { label: 'PSP', tone: 'Browser-first, still janky in Discord', browserFirst: true, warning: 'Open PSP in the browser for the best shot at a decent session.' },
};

const FEATURED_TITLES = [
  ['psx', 'Crash Bandicoot'],
  ['gba', 'Pokemon FireRed: Rocket Edition'],
  ['n64', 'Mario Kart 64'],
  ['snes', 'The Legend of Zelda: A Link to the Past'],
  ['nds', 'Pokemon HeartGold Version'],
];

const BEST_BET_TITLES = [
  ['gb', 'Pokemon Yellow Version: Special Pikachu Edition'],
  ['gba', 'Pokemon Glazed 7B'],
  ['snes', 'Super Mario All-Stars + Super Mario World'],
  ['n64', 'Super Smash Bros.'],
  ['psx', 'Crash Bandicoot'],
  ['nds', 'New Super Mario Bros. (USA)'],
];

const BROWSER_FIRST_TITLES = [
  ['psp', 'Kingdom Hearts Birth by Sleep Final Mix (English Patched)'],
  ['psp', 'Grand Theft Auto: Vice City Stories'],
  ['psp', 'Crisis Core: Final Fantasy VII'],
  ['psp', 'Final Fantasy Tactics: The War of the Lions'],
];

function setText(el, value) {
  if (el) el.textContent = value;
}

function isEmbeddedContext() {
  try {
    return window.self !== window.top;
  } catch (error) {
    return true;
  }
}

function isDiscordActivityHost() {
  return /(?:^|\.)discordsays\.com$/i.test(window.location.hostname);
}

function isGitHubPagesHost() {
  return window.location.hostname === 'clawbert93.github.io';
}

function getCurrentActivityRoutePath() {
  const pathname = String(window.location.pathname || '').trim();
  if (/\/activity(?:\.html)?$/i.test(pathname)) return pathname;
  return isGitHubPagesHost() ? 'activity.html' : '/activity';
}

function slugifyTitle(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildPlayerHref(core, options = {}) {
  const params = new URLSearchParams();
  params.set('core', core);
  if (options.game) params.set('game', slugifyTitle(options.game));
  if (options.launch) params.set('launch', '1');
  if (options.multiplayer) params.set('multiplayer', '1');
  if (options.embedded !== false && core !== 'psp') params.set('embedded', '1');
  if (options.activity !== false && core !== 'psp') params.set('activity', '1');
  const roomId = String(options.room || activityState.instanceId || '').trim();
  if (roomId) params.set('room', roomId);
  const clientId = String(options.clientId || activityState.clientId || '').trim();
  if (clientId && core !== 'psp') params.set('client_id', clientId);
  params.set('rev', ACTIVITY_REV);
  return `${isGitHubPagesHost() ? 'play.html' : '/play'}?${params.toString()}`;
}

function buildActivityRouteHref(core, options = {}) {
  const params = new URLSearchParams();
  params.set('core', core);
  if (options.game) params.set('game', slugifyTitle(options.game));
  if (options.launch) params.set('launch', '1');
  if (options.multiplayer) params.set('multiplayer', '1');
  if (options.embedded !== false && core !== 'psp') params.set('embedded', '1');
  if (options.activity !== false && core !== 'psp') params.set('activity', '1');
  const roomId = String(options.room || activityState.instanceId || '').trim();
  if (roomId) params.set('room', roomId);
  const clientId = String(options.clientId || activityState.clientId || '').trim();
  if (clientId && core !== 'psp') params.set('client_id', clientId);
  params.set('rev', ACTIVITY_REV);
  return `${getCurrentActivityRoutePath()}?${params.toString()}`;
}

function buildLaunchHref(core, options = {}) {
  if (activityState.insideDiscord && core !== 'psp') {
    return buildActivityRouteHref(core, options);
  }
  return buildPlayerHref(core, options);
}

function updateActivityUrl(params) {
  try {
    const next = new URL(window.location.href);
    ['core', 'game', 'launch', 'multiplayer', 'embedded', 'activity', 'room', 'rev'].forEach((key) => next.searchParams.delete(key));
    for (const [key, value] of params.entries()) {
      next.searchParams.set(key, value);
    }
    if (params.get('core')) {
      next.searchParams.set('activity', '1');
      next.searchParams.set('embedded', '1');
      next.searchParams.set('rev', ACTIVITY_REV);
    }
    window.history.replaceState({}, '', `${next.pathname}${next.search}`);
  } catch (error) {}
}

function closeEmbeddedPlayerMode({ updateHistory = true } = {}) {
  if (activityPlayerOverlayEl) {
    activityPlayerOverlayEl.remove();
    activityPlayerOverlayEl = null;
  }
  activityShellEl?.classList.remove('activity-player-mode');
  document.documentElement.classList.remove('activity-player-open');
  document.body.classList.remove('activity-player-open');

  if (updateHistory) {
    try {
      const next = new URL(window.location.href);
      ['core', 'game', 'launch', 'multiplayer', 'embedded', 'activity', 'room', 'rev'].forEach((key) => next.searchParams.delete(key));
      if (activityState.clientId) next.searchParams.set('client_id', activityState.clientId);
      if (activityState.insideDiscord) next.searchParams.set('discord', '1');
      window.history.replaceState({}, '', `${next.pathname}${next.search}`);
    } catch (error) {}
  }
}

function syncHeroActionLinks() {
  const heroActionsEl = document.getElementById('activityHeroActions');
  if (!heroActionsEl) return;

  heroActionsEl.querySelectorAll('a[href*="/play"], a[href*="play.html?"], a[href*="/activity?"], a[href*="activity.html?"]').forEach((link) => {
    const parsed = new URL(link.getAttribute('href') || '', window.location.href);
    const core = parsed.searchParams.get('core');
    if (!core) return;
    link.href = buildLaunchHref(core, {
      game: parsed.searchParams.get('game') || '',
      launch: parsed.searchParams.get('launch') === '1',
      multiplayer: parsed.searchParams.get('multiplayer') === '1',
      embedded: true,
      activity: true,
    });
  });
}

function renderEmbeddedPlayerMode(params) {
  const core = String(params.get('core') || '').trim();
  if (!core) return false;

  if (!activityShellEl) return false;
  closeEmbeddedPlayerMode({ updateHistory: false });
  activityShellEl.classList.add('activity-player-mode');
  document.documentElement.classList.add('activity-player-open');
  document.body.classList.add('activity-player-open');

  const playerHref = buildPlayerHref(core, {
    game: params.get('game') || '',
    launch: params.get('launch') === '1',
    multiplayer: params.get('multiplayer') === '1',
    room: params.get('room') || activityState.instanceId || '',
    clientId: params.get('client_id') || activityState.clientId || '',
    embedded: true,
    activity: true,
  });

  const card = document.createElement('section');
  card.className = 'card activity-section activity-player-card activity-player-overlay';

  const topRow = document.createElement('div');
  topRow.className = 'activity-section-head activity-player-head';

  const titleWrap = document.createElement('div');
  const eyebrow = document.createElement('p');
  eyebrow.className = 'eyebrow';
  eyebrow.textContent = '🎮 Activity player';
  const heading = document.createElement('h2');
  heading.textContent = `${String(core).toUpperCase()} player`;
  const note = document.createElement('p');
  note.className = 'subtle';
  note.textContent = 'Staying on the Discord-approved Activity route, loading the player inside this page for mobile compatibility.';
  titleWrap.appendChild(eyebrow);
  titleWrap.appendChild(heading);
  titleWrap.appendChild(note);

  const backLink = document.createElement('button');
  backLink.className = 'button';
  backLink.type = 'button';
  backLink.textContent = 'Back to hub';
  backLink.addEventListener('click', () => {
    closeEmbeddedPlayerMode({ updateHistory: true });
  });

  topRow.appendChild(titleWrap);
  topRow.appendChild(backLink);
  card.appendChild(topRow);

  const frame = document.createElement('iframe');
  frame.src = playerHref;
  frame.title = `${String(core).toUpperCase()} embedded player`;
  frame.className = 'activity-player-frame';
  frame.setAttribute('allow', 'autoplay; clipboard-read; clipboard-write; fullscreen; gamepad');
  frame.setAttribute('allowfullscreen', 'true');
  card.appendChild(frame);

  activityPlayerOverlayEl = card;
  activityShellEl.appendChild(card);
  updateActivityUrl(new URLSearchParams(playerHref.split('?')[1] || ''));
  return true;
}

function handleInPlaceActivityLaunch(event) {
  const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
  if (!link || link.target === '_blank' || link.hasAttribute('download')) return;

  const href = link.getAttribute('href') || '';
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

  let target;
  try {
    target = new URL(href, window.location.href);
  } catch (error) {
    return;
  }

  if (target.origin !== window.location.origin) return;
  if (!activityState.insideDiscord) return;
  if (!/\/activity(?:\.html)?$/i.test(target.pathname) && target.pathname !== window.location.pathname) return;

  const core = String(target.searchParams.get('core') || '').trim().toLowerCase();
  if (!core || core === 'psp') return;

  event.preventDefault();
  renderEmbeddedPlayerMode(target.searchParams);
}

function createTile({ title, body, badges = [], actions = [] }) {
  const tile = document.createElement('article');
  tile.className = 'activity-tile';

  const heading = document.createElement('h3');
  heading.textContent = title;
  tile.appendChild(heading);

  if (badges.length) {
    const meta = document.createElement('div');
    meta.className = 'activity-meta';
    badges.forEach((badge) => {
      const span = document.createElement('span');
      span.className = `activity-badge${badge.warning ? ' warning' : ''}`;
      span.textContent = badge.label;
      meta.appendChild(span);
    });
    tile.appendChild(meta);
  }

  const copy = document.createElement('p');
  copy.textContent = body;
  tile.appendChild(copy);

  if (actions.length) {
    const actionRow = document.createElement('div');
    actionRow.className = 'activity-tile-actions';
    actions.forEach((action) => {
      const link = document.createElement('a');
      link.className = `button${action.primary ? ' primary' : ''}`;
      link.href = action.href;
      link.textContent = action.label;
      if (action.external) {
        link.target = '_blank';
        link.rel = 'noreferrer';
      }
      actionRow.appendChild(link);
    });
    tile.appendChild(actionRow);
  }

  return tile;
}

function findGame(library, core, title) {
  return (library[core] || []).find((entry) => String(entry.title || '').trim() === title) || null;
}

function firstGame(library, core) {
  return (library[core] || [])[0] || null;
}

function renderMultiplayerLab(library) {
  if (!multiplayerLabEl) return;
  multiplayerLabEl.innerHTML = '';

  const smash = findGame(library, 'n64', 'Super Smash Bros.') || firstGame(library, 'n64');
  const roomCopy = activityState.instanceId
    ? `This Activity instance is ${activityState.instanceId}. Anyone who joins this instance should land in the same shared room context.`
    : 'Discord has not handed us the instance id yet, but the shared-room launch path is already wired for the same-instance test.';

  multiplayerLabEl.appendChild(createTile({
    title: smash?.title || 'Phase 0 Smash test room',
    body: `${roomCopy} Joiners should begin as watch-only, and the host-side player page now has the first room panel and slot assignment groundwork.`,
    badges: [
      { label: 'Phase 0' },
      { label: 'N64' },
      { label: 'Watch-only joins' },
    ],
    actions: [
      { label: 'Launch shared Smash test', href: buildLaunchHref('n64', { game: smash?.title || 'Super Smash Bros.', launch: true, multiplayer: true, embedded: true, activity: true }), primary: true },
      { label: 'Open N64 shelf', href: buildLaunchHref('n64', { embedded: true, activity: true }) },
    ],
  }));
}

function renderLibrary(library) {
  latestLibrary = library;
  const systemKeys = Object.keys(SYSTEM_META).filter((key) => Array.isArray(library[key]) && library[key].length > 0);
  const totalGames = systemKeys.reduce((sum, key) => sum + library[key].length, 0);
  setText(libraryStatsEl, `${systemKeys.length} systems, ${totalGames} curated games live.`);
  setText(statusEl, `Discord game hub loaded. ${totalGames} curated games are live across ${systemKeys.length} systems, with lighter shelves kept in Discord and PSP split into browser-first mode.`);

  renderMultiplayerLab(library);

  systemShelfGridEl.innerHTML = '';
  systemKeys.forEach((core) => {
    const meta = SYSTEM_META[core];
    const list = library[core] || [];
    const badges = [
      { label: `${list.length} games` },
      meta.browserFirst ? { label: 'Browser-first', warning: true } : { label: 'In Discord' },
    ];
    if (meta.warning) badges.push({ label: 'Heads up', warning: true });
    const actions = meta.browserFirst
      ? [
          { label: `Open ${meta.label} in browser`, href: isGitHubPagesHost() ? `play.html?core=${core}` : `/play?core=${core}`, primary: true, external: true },
        ]
      : [
          { label: `Open ${meta.label} shelf`, href: buildLaunchHref(core, { embedded: true, activity: true }), primary: true },
        ];
    systemShelfGridEl.appendChild(createTile({
      title: meta.label,
      body: `${meta.tone}. ${meta.warning || 'Curated dropdown is ready the moment the shelf opens.'}`,
      badges,
      actions,
    }));
  });

  featuredLaunchesEl.innerHTML = '';
  FEATURED_TITLES.map(([core, title]) => findGame(library, core, title)).filter(Boolean).forEach((entry) => {
    const meta = SYSTEM_META[Object.keys(SYSTEM_META).find((key) => (library[key] || []).includes(entry))];
    featuredLaunchesEl.appendChild(createTile({
      title: entry.title,
      body: meta.browserFirst
        ? `${meta.label} pick. Best launched in the browser, not trapped inside Discord.`
        : `${meta.label} pick. Good fast start for a room session without digging through the full shelf first.`,
      badges: [
        { label: meta.label },
        meta.browserFirst ? { label: 'Browser-first', warning: true } : { label: 'Launch inside Discord' },
      ],
      actions: [
        meta.browserFirst
          ? { label: 'Open in browser', href: buildPlayerHref(Object.keys(SYSTEM_META).find((key) => (library[key] || []).includes(entry)), { game: entry.title, launch: true, embedded: false, activity: false }), primary: true, external: true }
          : { label: 'Launch now', href: buildLaunchHref(Object.keys(SYSTEM_META).find((key) => (library[key] || []).includes(entry)), { game: entry.title, launch: true, embedded: true, activity: true }), primary: true },
      ],
    }));
  });

  activityBestBetsEl.innerHTML = '';
  BEST_BET_TITLES.map(([core, title]) => [core, findGame(library, core, title) || firstGame(library, core)]).filter(([, entry]) => !!entry).forEach(([core, entry]) => {
    const meta = SYSTEM_META[core];
    activityBestBetsEl.appendChild(createTile({
      title: entry.title,
      body: meta.warning || `${meta.label} is one of the smoother fits for Discord room play.`,
      badges: [
        { label: meta.label },
        { label: 'Activity-ready' },
      ],
      actions: [
        { label: 'Launch in Discord', href: buildLaunchHref(core, { game: entry.title, launch: true, embedded: true, activity: true }), primary: true },
        { label: `Open ${meta.label} shelf`, href: buildLaunchHref(core, { embedded: true, activity: true }) },
      ],
    }));
  });

  browserFirstLaneEl.innerHTML = '';
  BROWSER_FIRST_TITLES.map(([core, title]) => [core, findGame(library, core, title) || firstGame(library, core)]).filter(([, entry]) => !!entry).forEach(([core, entry]) => {
    const meta = SYSTEM_META[core];
    browserFirstLaneEl.appendChild(createTile({
      title: entry.title,
      body: meta.warning || `${meta.label} is still better outside the embedded Activity view.`,
      badges: [
        { label: meta.label },
        { label: 'Browser-first', warning: true },
      ],
      actions: [
        { label: 'Open in browser', href: buildPlayerHref(core, { game: entry.title, launch: true, embedded: false, activity: false }), primary: true, external: true },
        { label: `Open ${meta.label} shelf`, href: isGitHubPagesHost() ? `play.html?core=${core}` : `/play?core=${core}`, external: true },
      ],
    }));
  });
}

async function loadLibrary() {
  try {
    const response = await fetch(isGitHubPagesHost() ? 'data/game-library.json' : '/data/game-library.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Library fetch failed: ${response.status}`);
    const library = await response.json();
    renderLibrary(library);
  } catch (error) {
    console.error('Activity library load failed', error);
    setText(libraryStatsEl, 'Could not load the curated library right now.');
    setText(statusEl, 'The Activity shell loaded, but the live game shelf failed to populate.');
  }
}

function sanitizeParticipantList(rawParticipants) {
  return Array.isArray(rawParticipants)
    ? rawParticipants.map((entry) => ({
        id: String(entry?.id || entry?.userId || entry?.user_id || '').trim(),
        displayName: String(entry?.displayName || entry?.global_name || entry?.globalName || entry?.username || entry?.nick || entry?.name || 'Unknown player').trim(),
      })).filter((entry) => entry.id || entry.displayName)
    : [];
}

async function refreshDiscordParticipants() {
  if (!activityState.discordSdk?.commands?.getInstanceConnectedParticipants) return;
  try {
    const payload = await activityState.discordSdk.commands.getInstanceConnectedParticipants();
    const participants = sanitizeParticipantList(payload?.participants || payload || []);
    activityState.participants = participants;
    setText(activityParticipantCountEl, participants.length ? `${participants.length} connected` : 'No participants reported yet.');
  } catch (error) {
    console.error('Discord participant fetch failed', error);
    setText(activityParticipantCountEl, 'Could not read participants yet.');
  }
}

async function connectDiscord(clientId, insideDiscord) {
  activityState.clientId = clientId;
  activityState.insideDiscord = insideDiscord;

  if (!insideDiscord) {
    setText(discordAuthStateEl, 'Standalone browser preview, Discord SDK not required.');
    setText(activityInstanceIdEl, 'Standalone preview, no Discord instance id.');
    setText(activityParticipantCountEl, 'Standalone preview.');
    syncHeroActionLinks();
    return;
  }

  try {
    const { DiscordSDK } = await import('/assets/vendor/discord-embedded-app-sdk.bundle.mjs');
    const discordSdk = new DiscordSDK(clientId);
    activityState.discordSdk = discordSdk;
    activityState.instanceId = String(discordSdk.instanceId || '').trim();
    setText(activityInstanceIdEl, activityState.instanceId || 'Discord SDK connected, but instance id was blank.');
    await discordSdk.ready();
    activityState.instanceId = String(discordSdk.instanceId || activityState.instanceId || '').trim();
    setText(activityInstanceIdEl, activityState.instanceId || 'Discord SDK connected, but instance id was blank.');
    setText(discordAuthStateEl, 'Discord SDK connected.');
    syncHeroActionLinks();
    await refreshDiscordParticipants();
    if (latestLibrary) renderMultiplayerLab(latestLibrary);
  } catch (error) {
    console.error('Discord Activity SDK init failed', error);
    setText(discordAuthStateEl, 'SDK init failed. Check the Activity portal mappings and client ID.');
    syncHeroActionLinks();
    if (!statusEl.textContent || statusEl.textContent.includes('loaded')) {
      setText(statusEl, 'The in-Discord game hub loaded, but the Discord SDK handshake did not complete yet.');
    }
  }
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const clientId = params.get('client_id') || DEFAULT_DISCORD_CLIENT_ID;
  const insideDiscord = isEmbeddedContext() || params.get('discord') === '1' || isDiscordActivityHost();
  activityState.clientId = clientId;
  activityState.insideDiscord = insideDiscord;
  setText(discordDetectedEl, insideDiscord ? 'Yes, embedded context detected.' : 'No, running as a standalone preview.');
  syncHeroActionLinks();

  document.addEventListener('click', handleInPlaceActivityLaunch, true);

  await Promise.allSettled([
    connectDiscord(clientId, insideDiscord),
    loadLibrary(),
  ]);

  if (params.get('core') && insideDiscord) {
    renderEmbeddedPlayerMode(params);
  }
}

init();
