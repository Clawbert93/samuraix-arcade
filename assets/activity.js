const DEFAULT_DISCORD_CLIENT_ID = '1494677350439452733';
const statusEl = document.getElementById('activityStatus');
const discordDetectedEl = document.getElementById('discordDetected');
const discordAuthStateEl = document.getElementById('discordAuthState');
const libraryStatsEl = document.getElementById('libraryStats');
const featuredLaunchesEl = document.getElementById('featuredLaunches');
const systemShelfGridEl = document.getElementById('systemShelfGrid');
const activityBestBetsEl = document.getElementById('activityBestBets');
const browserFirstLaneEl = document.getElementById('browserFirstLane');

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
  if (options.embedded !== false && core !== 'psp') params.set('embedded', '1');
  if (options.activity !== false && core !== 'psp') params.set('activity', '1');
  return `/play?${params.toString()}`;
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

function renderLibrary(library) {
  const systemKeys = Object.keys(SYSTEM_META).filter((key) => Array.isArray(library[key]) && library[key].length > 0);
  const totalGames = systemKeys.reduce((sum, key) => sum + library[key].length, 0);
  setText(libraryStatsEl, `${systemKeys.length} systems, ${totalGames} curated games live.`);
  setText(statusEl, `Discord game hub loaded. ${totalGames} curated games are live across ${systemKeys.length} systems, with lighter shelves kept in Discord and PSP split into browser-first mode.`);

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
          { label: `Open ${meta.label} in browser`, href: `/play?core=${core}`, primary: true, external: true },
        ]
      : [
          { label: `Open ${meta.label} shelf`, href: buildPlayerHref(core, { embedded: true, activity: true }), primary: true },
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
          : { label: 'Launch now', href: buildPlayerHref(Object.keys(SYSTEM_META).find((key) => (library[key] || []).includes(entry)), { game: entry.title, launch: true, embedded: true, activity: true }), primary: true },
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
        { label: 'Launch in Discord', href: buildPlayerHref(core, { game: entry.title, launch: true, embedded: true, activity: true }), primary: true },
        { label: `Open ${meta.label} shelf`, href: buildPlayerHref(core, { embedded: true, activity: true }) },
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
        { label: `Open ${meta.label} shelf`, href: `/play?core=${core}`, external: true },
      ],
    }));
  });
}

async function loadLibrary() {
  try {
    const response = await fetch('/data/game-library.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Library fetch failed: ${response.status}`);
    const library = await response.json();
    renderLibrary(library);
  } catch (error) {
    console.error('Activity library load failed', error);
    setText(libraryStatsEl, 'Could not load the curated library right now.');
    setText(statusEl, 'The Activity shell loaded, but the live game shelf failed to populate.');
  }
}

async function connectDiscord(clientId, insideDiscord) {
  if (!insideDiscord) {
    setText(discordAuthStateEl, 'Standalone browser preview, Discord SDK not required.');
    return;
  }

  try {
    const { DiscordSDK } = await import('/assets/vendor/discord-embedded-app-sdk.bundle.mjs');
    const discordSdk = new DiscordSDK(clientId);
    await discordSdk.ready();
    setText(discordAuthStateEl, 'Discord SDK connected.');
  } catch (error) {
    console.error('Discord Activity SDK init failed', error);
    setText(discordAuthStateEl, 'SDK init failed. Check the Activity portal mappings and client ID.');
    if (!statusEl.textContent || statusEl.textContent.includes('loaded')) {
      setText(statusEl, 'The in-Discord game hub loaded, but the Discord SDK handshake did not complete yet.');
    }
  }
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const clientId = params.get('client_id') || DEFAULT_DISCORD_CLIENT_ID;
  const insideDiscord = isEmbeddedContext() || params.get('discord') === '1';
  setText(discordDetectedEl, insideDiscord ? 'Yes, embedded context detected.' : 'No, running as a standalone preview.');

  await Promise.allSettled([
    connectDiscord(clientId, insideDiscord),
    loadLibrary(),
  ]);
}

init();
