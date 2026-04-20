const DEFAULT_DISCORD_CLIENT_ID = '1494677350439452733';
const ACTIVITY_REV = 'mobilelane20apr2';
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

const MOBILE_ACTIVITY_SAFE_CORES = new Set(['gb', 'snes', 'gba']);
const MOBILE_ACTIVITY_CAUTION_CORES = new Set(['nds', 'n64', 'psx']);

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

function isLikelyTouchDevice() {
  try {
    if (window.matchMedia?.('(pointer: coarse)').matches) return true;
  } catch (error) {}
  return Number(navigator.maxTouchPoints || 0) > 0 || 'ontouchstart' in window;
}

function isDiscordMobileLike() {
  return activityState.insideDiscord && isLikelyTouchDevice();
}

function getLaunchPolicy(core) {
  if (core === 'psp') {
    if (activityState.insideDiscord) {
      return {
        mode: 'activity-shelf',
        badge: 'PSP browser shelf',
        badgeWarning: true,
        copy: 'PSP still belongs in the browser, but the Discord button now opens a real PSP shelf first so people can pick a game instead of hitting a dead browser popout.',
      };
    }

    return {
      mode: 'external-browser',
      badge: 'Browser-first',
      badgeWarning: true,
      copy: 'PSP stays browser-only. Discord mobile should not pretend this is a dependable embedded lane.',
    };
  }

  if (isDiscordMobileLike()) {
    if (MOBILE_ACTIVITY_SAFE_CORES.has(core)) {
      return {
        mode: 'activity',
        badge: 'Mobile Activity-ready',
        badgeWarning: false,
        copy: `${SYSTEM_META[core]?.label || core.toUpperCase()} is one of the safer Discord mobile lanes right now.`,
      };
    }

    if (MOBILE_ACTIVITY_CAUTION_CORES.has(core)) {
      return {
        mode: 'activity',
        badge: core === 'nds' ? 'Mobile touch lane' : 'Mobile test lane',
        badgeWarning: true,
        copy: core === 'nds'
          ? 'DS now stays inside the Discord mobile Activity lane again, using the safer DeSmuME touch fallback instead of bouncing to a blocked page.'
          : `${SYSTEM_META[core]?.label || core.toUpperCase()} can still launch in Discord on mobile, but it should be treated as a cautious test lane, not a guaranteed clean fit.`,
      };
    }
  }

  return {
    mode: activityState.insideDiscord && core !== 'psp' ? 'activity' : 'player',
    badge: activityState.insideDiscord && core !== 'psp' ? 'In Discord' : 'Browser player',
    badgeWarning: false,
    copy: '',
  };
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
  if (options.activityIframe && core !== 'psp') params.set('activity_iframe', '1');
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

function buildLaunchSpec(core, options = {}) {
  const policy = getLaunchPolicy(core);

  if (policy.mode === 'external-browser') {
    return {
      href: buildPlayerHref(core, { ...options, embedded: false, activity: false, activityIframe: false }),
      external: true,
      mode: policy.mode,
    };
  }

  if (policy.mode === 'activity-shelf') {
    return {
      href: buildActivityRouteHref(core, { ...options, embedded: false, activity: false }),
      external: false,
      mode: policy.mode,
    };
  }

  if (policy.mode === 'standalone-player') {
    return {
      href: buildPlayerHref(core, { ...options, embedded: false, activity: false, activityIframe: false }),
      external: false,
      mode: policy.mode,
    };
  }

  if (activityState.insideDiscord && core !== 'psp') {
    return {
      href: buildActivityRouteHref(core, options),
      external: false,
      mode: 'activity',
    };
  }

  return {
    href: buildPlayerHref(core, options),
    external: false,
    mode: 'player',
  };
}

function buildLaunchHref(core, options = {}) {
  return buildLaunchSpec(core, options).href;
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
      if (params.get('core') !== 'psp') next.searchParams.set('embedded', '1');
      next.searchParams.set('rev', ACTIVITY_REV);
    }
    window.history.replaceState({}, '', `${next.pathname}${next.search}`);
  } catch (error) {}
}

async function openExternalUrl(url) {
  const target = String(url || '').trim();
  if (!target) return false;

  try {
    if (activityState.insideDiscord && activityState.discordSdk?.commands?.openExternalLink) {
      await activityState.discordSdk.commands.openExternalLink({ url: target });
      return true;
    }
  } catch (error) {
    console.error('Discord external link open failed', error);
  }

  try {
    const opened = window.open(target, '_blank', 'noopener,noreferrer');
    if (opened) return true;
  } catch (error) {}

  try {
    window.location.assign(target);
    return true;
  } catch (error) {}

  return false;
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
    const launch = buildLaunchSpec(core, {
      game: parsed.searchParams.get('game') || '',
      launch: parsed.searchParams.get('launch') === '1',
      multiplayer: parsed.searchParams.get('multiplayer') === '1',
      embedded: true,
      activity: true,
    });
    link.href = launch.href;
    if (launch.external) {
      link.target = '_blank';
      link.rel = 'noreferrer';
    } else {
      link.removeAttribute('target');
      link.removeAttribute('rel');
    }
  });
}

function renderEmbeddedPlayerMode(params) {
  const core = String(params.get('core') || '').trim();
  if (!core) return false;

  if (core === 'psp') {
    return renderPspBrowserShelfMode(params);
  }

  const launch = buildLaunchSpec(core, {
    game: params.get('game') || '',
    launch: params.get('launch') === '1',
    multiplayer: params.get('multiplayer') === '1',
    room: params.get('room') || activityState.instanceId || '',
    clientId: params.get('client_id') || activityState.clientId || '',
    embedded: true,
    activity: true,
    activityIframe: true,
  });

  if (launch.mode !== 'activity') {
    window.location.assign(launch.href);
    return false;
  }

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
    activityIframe: true,
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

  const actions = document.createElement('div');
  actions.className = 'activity-player-head-actions';

  const backLink = document.createElement('button');
  backLink.className = 'button';
  backLink.type = 'button';
  backLink.textContent = 'Back to hub';
  backLink.addEventListener('click', () => {
    closeEmbeddedPlayerMode({ updateHistory: true });
  });

  const browserUrl = new URL(playerHref, window.location.href);
  browserUrl.searchParams.delete('embedded');
  browserUrl.searchParams.delete('activity');
  browserUrl.searchParams.delete('activity_iframe');
  browserUrl.searchParams.delete('client_id');

  const browserLink = document.createElement('button');
  browserLink.className = 'button';
  browserLink.type = 'button';
  browserLink.textContent = 'Open in browser';
  browserLink.addEventListener('click', async () => {
    await openExternalUrl(browserUrl.toString());
  });

  actions.appendChild(backLink);
  actions.appendChild(browserLink);

  topRow.appendChild(titleWrap);
  topRow.appendChild(actions);
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

function renderPspBrowserShelfMode(params) {
  if (!activityShellEl) return false;

  closeEmbeddedPlayerMode({ updateHistory: false });
  activityShellEl.classList.add('activity-player-mode');
  document.documentElement.classList.add('activity-player-open');
  document.body.classList.add('activity-player-open');

  const card = document.createElement('section');
  card.className = 'card activity-section activity-player-card activity-player-overlay';

  const topRow = document.createElement('div');
  topRow.className = 'activity-section-head activity-player-head';

  const titleWrap = document.createElement('div');
  const eyebrow = document.createElement('p');
  eyebrow.className = 'eyebrow';
  eyebrow.textContent = '🌐 PSP browser shelf';
  const heading = document.createElement('h2');
  heading.textContent = 'PlayStation Portable';
  const note = document.createElement('p');
  note.className = 'subtle';
  note.textContent = 'PSP is still browser-first, but this shelf now stays inside the Discord Activity long enough for people to pick a game first.';
  titleWrap.appendChild(eyebrow);
  titleWrap.appendChild(heading);
  titleWrap.appendChild(note);

  const actions = document.createElement('div');
  actions.className = 'activity-player-head-actions';

  const backLink = document.createElement('button');
  backLink.className = 'button';
  backLink.type = 'button';
  backLink.textContent = 'Back to hub';
  backLink.addEventListener('click', () => {
    closeEmbeddedPlayerMode({ updateHistory: true });
  });

  const blankBrowserLink = document.createElement('button');
  blankBrowserLink.className = 'button';
  blankBrowserLink.type = 'button';
  blankBrowserLink.textContent = 'Open blank PSP player';
  blankBrowserLink.addEventListener('click', async () => {
    await openExternalUrl(buildPlayerHref('psp', { embedded: false, activity: false, activityIframe: false }));
  });

  actions.appendChild(backLink);
  actions.appendChild(blankBrowserLink);
  topRow.appendChild(titleWrap);
  topRow.appendChild(actions);
  card.appendChild(topRow);

  const noteBox = document.createElement('div');
  noteBox.className = 'note-box warning-box';
  noteBox.innerHTML = '<strong>PSP reality check:</strong> this still launches in the browser, not inside the Discord iframe. The fix here is the shelf flow, not a magic PSP stability breakthrough.';
  card.appendChild(noteBox);

  const grid = document.createElement('div');
  grid.className = 'activity-game-grid';

  const pspEntries = Array.isArray(latestLibrary?.psp) ? latestLibrary.psp : [];
  const requestedGame = String(params.get('game') || '').trim().toLowerCase();

  if (!pspEntries.length) {
    const empty = document.createElement('p');
    empty.className = 'subtle';
    empty.textContent = 'PSP shelf data is not loaded yet.';
    grid.appendChild(empty);
  } else {
    pspEntries.forEach((entry) => {
      const tile = createTile({
        title: entry.title,
        body: entry.description || SYSTEM_META.psp.warning || 'Browser-first PSP test lane.',
        badges: [
          { label: 'PSP' },
          { label: getWebTierLabel(entry) || 'browser-first', warning: true },
          ...(requestedGame === slugifyTitle(entry.title) ? [{ label: 'Selected', warning: false }] : []),
        ],
      });

      const actionRow = document.createElement('div');
      actionRow.className = 'activity-tile-actions';

      const launchButton = document.createElement('button');
      launchButton.className = 'button primary';
      launchButton.type = 'button';
      launchButton.textContent = 'Open in browser';
      launchButton.addEventListener('click', async () => {
        await openExternalUrl(buildPlayerHref('psp', {
          game: entry.title,
          launch: true,
          embedded: false,
          activity: false,
          activityIframe: false,
        }));
      });

      actionRow.appendChild(launchButton);
      tile.appendChild(actionRow);
      grid.appendChild(tile);
    });
  }

  card.appendChild(grid);
  activityPlayerOverlayEl = card;
  activityShellEl.appendChild(card);

  const nextParams = new URLSearchParams();
  nextParams.set('core', 'psp');
  nextParams.set('activity', '1');
  nextParams.set('rev', ACTIVITY_REV);
  updateActivityUrl(nextParams);
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
  if (!core || !new Set(['activity', 'activity-shelf']).has(getLaunchPolicy(core).mode)) return;

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

  const smashLaunch = buildLaunchSpec('n64', { game: smash?.title || 'Super Smash Bros.', launch: true, multiplayer: true, embedded: true, activity: true });
  const n64ShelfLaunch = buildLaunchSpec('n64', { embedded: true, activity: true });

  multiplayerLabEl.appendChild(createTile({
    title: smash?.title || 'Phase 0 Smash test room',
    body: `${roomCopy} Joiners should begin as watch-only, and the host-side player page now has the first room panel and slot assignment groundwork.`,
    badges: [
      { label: 'Phase 0' },
      { label: 'N64' },
      { label: 'Watch-only joins' },
    ],
    actions: [
      { label: smashLaunch.mode === 'activity' ? 'Launch shared Smash test' : 'Open shared Smash test', href: smashLaunch.href, primary: true, external: smashLaunch.external },
      { label: n64ShelfLaunch.mode === 'activity' ? 'Open N64 shelf' : 'Open N64 player', href: n64ShelfLaunch.href, external: n64ShelfLaunch.external },
    ],
  }));
}

function renderLibrary(library) {
  latestLibrary = library;
  const systemKeys = Object.keys(SYSTEM_META).filter((key) => Array.isArray(library[key]) && library[key].length > 0);
  const totalGames = systemKeys.reduce((sum, key) => sum + library[key].length, 0);
  setText(libraryStatsEl, `${systemKeys.length} systems, ${totalGames} curated games live.`);
  setText(statusEl, isDiscordMobileLike()
    ? `Discord mobile mode loaded. ${totalGames} curated games are live, GB/GBC plus GBA plus SNES stay in the Activity lane, DS is back in the Activity lane with safer touch handling, and PSP now opens a browser shelf instead of a dead popout.`
    : `Discord game hub loaded. ${totalGames} curated games are live across ${systemKeys.length} systems, with lighter shelves kept in Discord and PSP split into a browser-first shelf.`);

  renderMultiplayerLab(library);

  systemShelfGridEl.innerHTML = '';
  systemKeys.forEach((core) => {
    const meta = SYSTEM_META[core];
    const list = library[core] || [];
    const policy = getLaunchPolicy(core);
    const shelfLaunch = buildLaunchSpec(core, { embedded: true, activity: true });
    const badges = [
      { label: `${list.length} games` },
      { label: policy.badge, warning: policy.badgeWarning },
    ];
    if (meta.warning) badges.push({ label: 'Heads up', warning: true });
    const actions = [
      {
        label: policy.mode === 'activity'
          ? `Open ${meta.label} shelf`
          : (policy.mode === 'activity-shelf' ? `Open ${meta.label} shelf` : (policy.mode === 'standalone-player' ? `Open ${meta.label} player` : `Open ${meta.label} in browser`)),
        href: shelfLaunch.href,
        primary: true,
        external: shelfLaunch.external,
      },
    ];
    systemShelfGridEl.appendChild(createTile({
      title: meta.label,
      body: `${meta.tone}. ${policy.copy || meta.warning || 'Curated dropdown is ready the moment the shelf opens.'}`,
      badges,
      actions,
    }));
  });

  featuredLaunchesEl.innerHTML = '';
  FEATURED_TITLES.map(([core, title]) => [core, findGame(library, core, title)]).filter(([, entry]) => Boolean(entry)).forEach(([core, entry]) => {
    const meta = SYSTEM_META[core];
    const policy = getLaunchPolicy(core);
    const launch = buildLaunchSpec(core, { game: entry.title, launch: true, embedded: true, activity: true });
    featuredLaunchesEl.appendChild(createTile({
      title: entry.title,
      body: policy.mode === 'activity'
        ? `${meta.label} pick. Good fast start for a room session without digging through the full shelf first.`
        : (policy.mode === 'activity-shelf'
          ? `${meta.label} pick. This now opens the in-Activity PSP shelf first so the browser handoff is chosen on purpose.`
          : `${meta.label} pick. This one now avoids the embedded mobile Activity lane on purpose and opens the safer player path instead.`),
      badges: [
        { label: meta.label },
        { label: policy.mode === 'activity' ? 'Launch inside Discord' : policy.badge, warning: policy.mode !== 'activity' },
      ],
      actions: [
        { label: policy.mode === 'activity' ? 'Launch now' : (policy.mode === 'activity-shelf' ? 'Open shelf' : (policy.mode === 'standalone-player' ? 'Open player' : 'Open in browser')), href: launch.href, primary: true, external: launch.external },
      ],
    }));
  });

  activityBestBetsEl.innerHTML = '';
  BEST_BET_TITLES
    .filter(([core]) => !(isDiscordMobileLike() && getLaunchPolicy(core).mode !== 'activity'))
    .map(([core, title]) => [core, findGame(library, core, title) || firstGame(library, core)])
    .filter(([, entry]) => !!entry)
    .forEach(([core, entry]) => {
    const meta = SYSTEM_META[core];
    const launch = buildLaunchSpec(core, { game: entry.title, launch: true, embedded: true, activity: true });
    const shelfLaunch = buildLaunchSpec(core, { embedded: true, activity: true });
    activityBestBetsEl.appendChild(createTile({
      title: entry.title,
      body: meta.warning || `${meta.label} is one of the smoother fits for Discord room play.`,
      badges: [
        { label: meta.label },
        { label: 'Activity-ready' },
      ],
      actions: [
        { label: 'Launch in Discord', href: launch.href, primary: true, external: launch.external },
        { label: `Open ${meta.label} shelf`, href: shelfLaunch.href, external: shelfLaunch.external },
      ],
    }));
  });

  browserFirstLaneEl.innerHTML = '';
  const browserLaneTitles = isDiscordMobileLike()
    ? [...BROWSER_FIRST_TITLES]
    : BROWSER_FIRST_TITLES;

  browserLaneTitles.map(([core, title]) => [core, findGame(library, core, title) || firstGame(library, core)]).filter(([, entry]) => !!entry).forEach(([core, entry]) => {
    const meta = SYSTEM_META[core];
    const launch = buildLaunchSpec(core, { game: entry.title, launch: true, embedded: false, activity: false });
    const shelfLaunch = buildLaunchSpec(core, { embedded: false, activity: false });
    browserFirstLaneEl.appendChild(createTile({
      title: entry.title,
      body: getLaunchPolicy(core).copy || meta.warning || `${meta.label} is still better outside the embedded Activity view.`,
      badges: [
        { label: meta.label },
        { label: getLaunchPolicy(core).badge, warning: true },
      ],
      actions: [
        { label: getLaunchPolicy(core).mode === 'activity-shelf' ? 'Open shelf' : (getLaunchPolicy(core).mode === 'standalone-player' ? 'Open player' : 'Open in browser'), href: launch.href, primary: true, external: launch.external },
        { label: getLaunchPolicy(core).mode === 'standalone-player' ? `Open ${meta.label} player` : `Open ${meta.label} shelf`, href: shelfLaunch.href, external: shelfLaunch.external },
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
