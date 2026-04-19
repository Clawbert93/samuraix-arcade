const DEFAULT_DISCORD_CLIENT_ID = '1494677350439452733';

const SYSTEMS = {
  gb: {
    title: 'Game Boy / Game Boy Color browser player',
    blurb: 'Upload a legal .gb or .gbc file, or pick a curated GB/GBC game from the dropdown. This is a very clean fit for the free browser stack.',
    caveat: 'GB/GBC note: this uses the Game Boy core and works with both classic Game Boy and Game Boy Color compatible ROMs.',
    links: [
      ['EmulatorJS Nintendo Game Boy docs', 'https://emulatorjs.org/docs/systems/nintendo-game-boy/'],
      ['Game Boy homebrew on itch.io', 'https://itch.io/games/tag-game-boy'],
      ['Game Boy Color homebrew on itch.io', 'https://itch.io/games/tag-game-boy-color'],
      ['GameBrew GB/GBC homebrew list', 'https://www.gamebrew.org/wiki/List_of_GB_homebrew_applications'],
    ],
    accept: '.gb,.gbc,.zip,.7z',
  },
  snes: {
    title: 'Super Nintendo browser player',
    blurb: 'Upload a legal SNES ROM you own, or use the dropdown once curated games are added. SNES is another very clean fit for this free browser setup.',
    caveat: 'SNES note: this stack supports normal SNES ROM formats cleanly in-browser, with no usual BIOS hassle.',
    links: [
      ['EmulatorJS SNES docs', 'https://emulatorjs.org/docs/systems/snes/'],
      ['SNES homebrew on itch.io', 'https://itch.io/games/tag-snes'],
      ['SNES development wiki', 'https://www.romhacking.net/?page=utilities&category=&platform=9&game=&author=&os=&level=&perpage=20&title=&desc=&utilsearch=Go'],
    ],
    accept: '.smc,.sfc,.fig,.swc,.zip,.7z',
  },
  nds: {
    title: 'Nintendo DS browser player',
    blurb: 'Upload a legal .nds file or homebrew build. On phones and tablets this page now prefers a safer DS fallback path because recent EmulatorJS mobile touch behavior has been flaky.',
    caveat: 'DS note: some titles may need extra BIOS or firmware for best compatibility. On touch devices this page now favors reliability over speed so stylus controls have a better shot at working.',
    links: [
      ['Nintendo DS homebrew on itch.io', 'https://itch.io/games/tag-nintendo-ds'],
      ['DS-Homebrew wiki', 'https://wiki.ds-homebrew.com/'],
      ['GameBrew Nintendo DS homebrew list', 'https://www.gamebrew.org/wiki/List_of_DS_homebrew_applications'],
    ],
    accept: '.nds,.zip,.7z',
  },
  gba: {
    title: 'Game Boy Advance browser player',
    blurb: 'Upload a legal .gba file or homebrew build, or use the dropdown when curated games are added.',
    caveat: 'GBA note: saves stay in this browser only unless we later add a backend.',
    links: [
      ['GBA homebrew on itch.io', 'https://itch.io/games/tag-gameboy-advance'],
      ['GameBrew GBA homebrew list', 'https://www.gamebrew.org/wiki/List_of_GBA_homebrew_applications'],
      ['gbajs project page', 'https://github.com/endrift/gbajs'],
    ],
    accept: '.gba,.zip,.7z',
  },
  n64: {
    title: 'Nintendo 64 browser player',
    blurb: 'Upload a legal N64 ROM you own, or use the dropdown once curated games are added. N64 fits this free browser setup pretty nicely for casual play.',
    caveat: 'N64 note: compatibility varies by game and browser, but this is one of the more realistic higher-end additions in the free stack.',
    links: [
      ['EmulatorJS Nintendo 64 docs', 'https://emulatorjs.org/docs/systems/nintendo-64/'],
      ['n64js project', 'https://github.com/hulkholden/n64js'],
      ['Retro browser emulation overview', 'https://emulation.gametechwiki.com/index.php/Emulators_on_browsers'],
    ],
    accept: '.z64,.n64,.v64,.zip,.7z',
  },
  psx: {
    title: 'PlayStation 1 browser player',
    blurb: 'Upload a legal PS1 image you own, or use the dropdown once curated games are added. PS1 is realistic in this free browser setup, but a proper BIOS helps compatibility a lot.',
    caveat: 'PS1 note: common BIOS files are often needed for best compatibility, and this site does not bundle any BIOS files.',
    links: [
      ['EmulatorJS PlayStation docs', 'https://emulatorjs.org/docs/systems/playstation/'],
      ['PlayStation homebrew and dev resources', 'https://www.psxdev.net/'],
      ['Retro homebrew resources on itch.io', 'https://itch.io/games/tag-playstation'],
    ],
    accept: '.cue,.bin,.img,.mdf,.pbp,.chd,.zip,.7z',
  },
  psp: {
    title: 'PlayStation Portable browser player',
    blurb: 'Upload a legal PSP game you own, or use the dropdown once curated games are added. PSP is experimental here and currently unreliable enough that many games will run badly or fail outright.',
    caveat: 'PSP note: expect poor performance, broken input, black screens, and some games not booting yet. Older systems are the safer choice until a better fix exists.',
    links: [
      ['EmulatorJS PSP docs', 'https://emulatorjs.org/docs/systems/psp/'],
      ['EmulatorJS changelog note for PSP support', 'https://emulatorjs.org/docs/news/'],
      ['Browser emulation overview', 'https://emulation.gametechwiki.com/index.php/Emulators_on_browsers'],
    ],
    accept: '.iso,.cso,.pbp,.zip,.7z',
  },
};

const params = new URLSearchParams(window.location.search);
const core = SYSTEMS[params.get('core')] ? params.get('core') : 'gb';
const requestedGameKey = String(params.get('game') || '').trim().toLowerCase();
const CANONICAL_ARCADE_ORIGIN = 'https://samuraix-arcade.roberteverland22.workers.dev';

if (core === 'psp' && window.location.hostname === 'clawbert93.github.io') {
  const target = new URL(`${CANONICAL_ARCADE_ORIGIN}/play`);
  for (const [key, value] of params.entries()) target.searchParams.append(key, value);
  target.searchParams.set('core', 'psp');
  window.location.replace(target.toString());
}
const autoLaunchRequested = ['1', 'true', 'yes'].includes(String(params.get('launch') || params.get('autostart') || '').trim().toLowerCase());
const config = SYSTEMS[core];
const embeddedMode = params.get('embedded') === '1';
const defaultEmulatorDataBase = embeddedMode ? '/emu/stable/data/' : 'https://cdn.emulatorjs.org/stable/data/';
const ndsMobileEmulatorDataBase = embeddedMode ? defaultEmulatorDataBase : 'https://cdn.emulatorjs.org/4.0.9/data/';

const titleEl = document.getElementById('systemTitle');
const blurbEl = document.getElementById('systemBlurb');
const caveatEl = document.getElementById('systemCaveat');
const linksEl = document.getElementById('legalLinks');
const inputEl = document.getElementById('romInput');
const dropdownEl = document.getElementById('gameSelect');
const dropdownWrapEl = document.getElementById('gameSelectWrap');
const dropdownNotesEl = document.getElementById('gameNotes');
const pspPresetWrapEl = document.getElementById('pspPresetWrap');
const pspPresetEl = document.getElementById('pspPreset');
const pspPresetNotesEl = document.getElementById('pspPresetNotes');
const embeddedFocusWrapEl = document.getElementById('embeddedFocusWrap');
const embeddedFocusButtonEl = document.getElementById('embeddedFocusButton');
const embeddedFocusNotesEl = document.getElementById('embeddedFocusNotes');
const buttonEl = document.getElementById('launchButton');
const fullscreenButtonEl = document.getElementById('fullscreenButton');
const popoutButtonEl = document.getElementById('popoutButton');
const statusEl = document.getElementById('launchStatus');
const frameEl = document.getElementById('gameFrame');
const embeddedWarningEl = document.getElementById('embeddedWarning');
const pspRuntimeInfoEl = document.getElementById('pspRuntimeInfo');
const roomPanelEl = document.getElementById('roomPanel');
const roomSummaryEl = document.getElementById('roomSummary');
const roomInstanceIdEl = document.getElementById('roomInstanceId');
const roomViewerStateEl = document.getElementById('roomViewerState');
const roomHostStateEl = document.getElementById('roomHostState');
const roomGameStateEl = document.getElementById('roomGameState');
const roomSlotSummaryEl = document.getElementById('roomSlotSummary');
const roomParticipantsEl = document.getElementById('roomParticipants');
const roomDebugNoteEl = document.getElementById('roomDebugNote');
const requestSeatButtonEl = document.getElementById('requestSeatButton');
const refreshRoomButtonEl = document.getElementById('refreshRoomButton');

if (frameEl) {
  frameEl.tabIndex = 0;
  frameEl.setAttribute('role', 'application');
}

if (titleEl) titleEl.textContent = config.title;
if (blurbEl) blurbEl.textContent = config.blurb;
if (caveatEl) caveatEl.textContent = config.caveat;
if (inputEl) inputEl.setAttribute('accept', config.accept);
if (linksEl) {
  config.links.forEach(([label, href]) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = href;
    a.target = '_blank';
    a.rel = 'noreferrer';
    a.textContent = label;
    li.appendChild(a);
    linksEl.appendChild(li);
  });
}

let selectedFile = null;
let selectedGame = null;
let library = {};
let objectUrl = null;
let launched = false;
let ndsTouchBridgeObserver = null;
let roomSyncTimer = null;
let discordRoomParticipants = [];
let multiplayerRoomState = null;
let discordSdkInstance = null;
let discordInstanceId = '';

const multiplayerRequested = ['1', 'true', 'yes'].includes(String(params.get('multiplayer') || '').trim().toLowerCase());
const roomViewerId = (() => {
  try {
    const existing = sessionStorage.getItem('samuraixArcadeViewerId');
    if (existing) return existing;
    const created = `viewer-${crypto.randomUUID().slice(0, 8)}`;
    sessionStorage.setItem('samuraixArcadeViewerId', created);
    return created;
  } catch (error) {
    return `viewer-${Math.random().toString(36).slice(2, 10)}`;
  }
})();
const roomViewerName = `Player ${roomViewerId.slice(-4)}`;
const PHASE0_MULTIPLAYER_CORE = 'n64';
const PHASE0_MULTIPLAYER_GAME = 'super-smash-bros';
const runtimeConfig = {
  netplay: {
    server: '',
    iceServers: [],
  },
};
let roomSyncedSelectionKey = '';

const CLOUD_PROXY_HOSTS = new Set([
  'pub-2c5587529e4249efbcf882d5d3697d95.r2.dev',
]);
const CLOUD_PROXY_PREFIX = '/cloud-assets-v3';
const PSP_PRESETS = {
  quality: {
    label: 'quality',
    note: 'Sharper and cleaner, but slower. Better for lighter PSP games on stronger desktops.',
    options: {
      ejs_threads: 'enabled',
      webgl2Enabled: 'enabled',
      ppsspp_internal_resolution: '480x272',
      ppsspp_frameskip: 'disabled',
      ppsspp_auto_frameskip: 'disabled',
      ppsspp_frame_duplication: 'enabled',
      ppsspp_gpu_hardware_transform: 'enabled',
      ppsspp_software_skinning: 'enabled',
      ppsspp_hardware_tesselation: 'disabled',
      ppsspp_texture_scaling_level: 'disabled',
      ppsspp_texture_deposterize: 'disabled',
      ppsspp_texture_shader: 'disabled',
      ppsspp_texture_anisotropic_filtering: '2x',
      ppsspp_texture_filtering: 'Auto',
      ppsspp_smart_2d_texture_filtering: 'disabled',
      ppsspp_lazy_texture_caching: 'disabled',
      ppsspp_spline_quality: 'Medium',
      ppsspp_lower_resolution_for_effects: 'disabled',
      ppsspp_skip_gpu_readbacks: 'disabled',
    },
  },
  'max-performance': {
    label: 'max performance',
    note: 'Most aggressive browser preset. Lower visual quality, heavier frameskip, and extra hacks for the best shot at barely-playable PSP.',
    options: {
      ejs_threads: 'enabled',
      webgl2Enabled: 'enabled',
      ppsspp_internal_resolution: '480x272',
      ppsspp_frameskip: '4',
      ppsspp_auto_frameskip: 'enabled',
      ppsspp_frame_duplication: 'disabled',
      ppsspp_gpu_hardware_transform: 'enabled',
      ppsspp_software_skinning: 'disabled',
      ppsspp_hardware_tesselation: 'disabled',
      ppsspp_texture_scaling_level: 'disabled',
      ppsspp_texture_deposterize: 'disabled',
      ppsspp_texture_shader: 'disabled',
      ppsspp_texture_anisotropic_filtering: 'disabled',
      ppsspp_texture_filtering: 'Nearest',
      ppsspp_smart_2d_texture_filtering: 'disabled',
      ppsspp_lazy_texture_caching: 'enabled',
      ppsspp_spline_quality: 'Low',
      ppsspp_lower_resolution_for_effects: 'Aggressive',
      ppsspp_skip_gpu_readbacks: 'enabled',
    },
  },
};
const PSP_PRESET_KEYS = Object.keys(PSP_PRESETS);
const NDS_TOUCH_OPTIONS = {
  desmume_pointer_mouse: 'enabled',
  desmume_pointer_type: 'touch',
};

function sameOriginCloudProxyUrl(rawUrl) {
  try {
    const parsed = new URL(String(rawUrl || ''));
    const shouldProxy = window.location.hostname !== 'clawbert93.github.io' && CLOUD_PROXY_HOSTS.has(parsed.hostname);
    if (!shouldProxy) return rawUrl;
    return `${window.location.origin}${CLOUD_PROXY_PREFIX}${parsed.pathname}${parsed.search || ''}`;
  } catch (error) {
    return rawUrl;
  }
}

function resolveEntryUrl(entry) {
  if (!entry) return '';
  if (typeof entry.url === 'string' && entry.url.trim()) {
    const rawUrl = entry.url.trim();
    return core === 'psp' ? rawUrl : sameOriginCloudProxyUrl(rawUrl);
  }
  if (typeof entry.file === 'string' && entry.file.trim()) return entry.file.trim();
  return '';
}

function getWebTier(entry) {
  return String(entry?.webTier || '').trim().toLowerCase();
}

function getWebTierLabel(entry) {
  const tier = getWebTier(entry);
  if (tier === 'browser-first') return 'browser-first';
  if (tier === 'experimental') return 'experimental';
  if (tier === 'not-recommended') return 'not recommended in web';
  return '';
}

function isExternalUrl(value) {
  return /^https?:\/\//i.test(String(value || ''));
}

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

function isEditableElement(node) {
  if (!(node instanceof HTMLElement)) return false;
  return node.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(node.tagName);
}

function getFocusableGameTarget() {
  if (!frameEl) return null;
  return frameEl.querySelector('canvas, iframe, [tabindex], .emulator-container') || frameEl;
}

function focusGameTarget() {
  const target = getFocusableGameTarget();
  if (!(target instanceof HTMLElement)) return;
  if (!target.hasAttribute('tabindex')) target.tabIndex = 0;
  try {
    window.focus();
  } catch (error) {}
  try {
    target.focus({ preventScroll: true });
  } catch (error) {
    try {
      target.focus();
    } catch (innerError) {}
  }
}

function installKeyboardFocusBridge() {
  if (!frameEl) return;
  const focusIfGameEvent = (event) => {
    if (!launched) return;
    if (!(event.target instanceof Node) || !frameEl.contains(event.target)) return;
    focusGameTarget();
  };
  frameEl.addEventListener('pointerdown', focusIfGameEvent, { passive: true });
  frameEl.addEventListener('mousedown', focusIfGameEvent, { passive: true });
  frameEl.addEventListener('touchstart', focusIfGameEvent, { passive: true });

  window.addEventListener('keydown', (event) => {
    if (!launched) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (isEditableElement(document.activeElement)) return;
    focusGameTarget();
  });
}

async function connectDiscordSdkIfEmbedded() {
  if (!embeddedMode) {
    startRoomSyncLoop();
    return;
  }

  try {
    const { DiscordSDK } = await import('/assets/vendor/discord-embedded-app-sdk.bundle.mjs');
    const clientId = params.get('client_id') || DEFAULT_DISCORD_CLIENT_ID;
    const discordSdk = new DiscordSDK(clientId);
    discordSdkInstance = discordSdk;
    discordInstanceId = String(discordSdk.instanceId || '').trim();
    window.__samuraixDiscordSdk = discordSdk;
    await discordSdk.ready();
    discordInstanceId = String(discordSdk.instanceId || discordInstanceId || '').trim();
    syncRoomAwareNavLinks();
    await refreshDiscordRoomParticipants();
  } catch (error) {
    console.error('Discord player SDK init failed', error);
  }

  syncRoomAwareNavLinks();
  startRoomSyncLoop();
}

function isLikelyTouchDevice() {
  try {
    if (window.matchMedia?.('(pointer: coarse)').matches) return true;
  } catch (error) {}
  return Number(navigator.maxTouchPoints || 0) > 0 || 'ontouchstart' in window;
}

function getRuntimeCore() {
  if (core === 'nds' && isLikelyTouchDevice()) return 'desmume';
  return core;
}

function getRuntimeDataBase() {
  if (core === 'nds' && isLikelyTouchDevice()) return ndsMobileEmulatorDataBase;
  return defaultEmulatorDataBase;
}

function installNdsTouchBridge() {
  if (core !== 'nds' || !isLikelyTouchDevice() || !frameEl) return;

  const bindCanvasTouchBridge = (node) => {
    if (!(node instanceof HTMLCanvasElement) || node.dataset.ndsTouchBridge === '1') return;
    node.dataset.ndsTouchBridge = '1';

    const relay = (event) => {
      const touches = Array.from(event.changedTouches || []);
      if (!touches.length) return;

      const pointerType = event.type === 'touchend' || event.type === 'touchcancel' ? 'pointerup' : (event.type === 'touchmove' ? 'pointermove' : 'pointerdown');
      const mouseType = event.type === 'touchend' || event.type === 'touchcancel' ? 'mouseup' : (event.type === 'touchmove' ? 'mousemove' : 'mousedown');

      for (const touch of touches) {
        const eventInit = {
          bubbles: true,
          cancelable: true,
          composed: true,
          clientX: touch.clientX,
          clientY: touch.clientY,
          screenX: touch.screenX,
          screenY: touch.screenY,
          pageX: touch.pageX,
          pageY: touch.pageY,
          button: 0,
          buttons: mouseType === 'mouseup' ? 0 : 1,
          ctrlKey: event.ctrlKey,
          shiftKey: event.shiftKey,
          altKey: event.altKey,
          metaKey: event.metaKey,
          view: window,
        };

        if (typeof window.PointerEvent === 'function') {
          node.dispatchEvent(new PointerEvent(pointerType, {
            ...eventInit,
            pointerId: touch.identifier + 1,
            pointerType: 'touch',
            isPrimary: touch.identifier === 0,
            pressure: mouseType === 'mouseup' ? 0 : 0.5,
          }));
        }

        node.dispatchEvent(new MouseEvent(mouseType, eventInit));
      }

      event.preventDefault();
    };

    ['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach((type) => {
      node.addEventListener(type, relay, { passive: false });
    });
  };

  frameEl.querySelectorAll('#game canvas').forEach(bindCanvasTouchBridge);

  if (ndsTouchBridgeObserver) ndsTouchBridgeObserver.disconnect();
  ndsTouchBridgeObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLCanvasElement) bindCanvasTouchBridge(node);
        if (node instanceof HTMLElement) node.querySelectorAll?.('canvas').forEach(bindCanvasTouchBridge);
      });
    });
  });
  ndsTouchBridgeObserver.observe(frameEl, { childList: true, subtree: true });
}

function getPspPresetKey() {
  const selected = String(pspPresetEl?.value || 'max-performance');
  return PSP_PRESET_KEYS.includes(selected) ? selected : 'max-performance';
}

function getPspPreset() {
  return PSP_PRESETS[getPspPresetKey()];
}

function isUnsupportedArchiveForCore(url, activeCore = core) {
  return activeCore === 'psp' && /\.rar(?:$|[?#])/i.test(String(url || ''));
}

function getUnsupportedArchiveMessage(url, activeCore = core) {
  if (!isUnsupportedArchiveForCore(url, activeCore)) return '';
  return 'This PSP entry is still packaged as a .rar archive. EmulatorJS boots to the menu instead of the game for that format here, so I need to repack it to .iso, .cso, .zip, or .7z.';
}

function getSystemStorageKey(activeCore, gameUrl, gameName) {
  let identifier = `1-${activeCore}`;
  if (typeof gameName === 'string' && gameName) {
    identifier += `-${gameName}`;
  } else if (typeof gameUrl === 'string' && gameUrl !== 'game' && !gameUrl.startsWith('blob:')) {
    identifier += `-${gameUrl}`;
  }
  return `ejs-${identifier}-settings`;
}

function applyCoreOptionsToStorage(activeCore, gameUrl, gameName, options) {
  if (!window.localStorage || !options || typeof options !== 'object') return;
  const storageKey = getSystemStorageKey(activeCore, gameUrl, gameName);
  let existing = { controlSettings: {}, settings: {}, cheats: [] };
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || '{}');
    if (parsed && typeof parsed === 'object') existing = { ...existing, ...parsed };
  } catch (error) {}
  existing.settings = { ...(existing.settings || {}), ...options };
  if (!Array.isArray(existing.cheats)) existing.cheats = [];
  if (!existing.controlSettings || typeof existing.controlSettings !== 'object') existing.controlSettings = {};
  localStorage.setItem(storageKey, JSON.stringify(existing));
}

function applyPspPresetToStorage(gameUrl, gameName, preset) {
  applyCoreOptionsToStorage('psp', gameUrl, gameName, preset?.options);
}

function syncPspPresetUi() {
  const showPspPreset = core === 'psp';
  const showEmbeddedFocus = embeddedMode && core !== 'psp';

  if (pspPresetWrapEl) pspPresetWrapEl.hidden = !showPspPreset;
  if (pspPresetNotesEl) {
    pspPresetNotesEl.hidden = !showPspPreset;
    if (showPspPreset) pspPresetNotesEl.textContent = getPspPreset().note;
  }

  if (embeddedFocusWrapEl) embeddedFocusWrapEl.hidden = !showEmbeddedFocus;
  if (embeddedFocusNotesEl) embeddedFocusNotesEl.hidden = !showEmbeddedFocus;
}

function syncEmbeddedWarnings() {
  if (embeddedWarningEl) {
    if (core === 'psp') {
      embeddedWarningEl.hidden = false;
      embeddedWarningEl.innerHTML = embeddedMode
        ? '<strong>PSP status:</strong> experimental and currently unreliable. In Discord/webviews it is even worse, expect bad performance, broken input, black screens, and failed boots. Browser popout is still only a maybe, not a promise.'
        : '<strong>PSP status:</strong> experimental and currently unreliable. Expect bad performance, broken input, black screens, and some games failing to boot. We are keeping it visible for testing, but it is not a dependable mode yet.';
    } else if (core === 'nds' && isLikelyTouchDevice()) {
      embeddedWarningEl.hidden = false;
      embeddedWarningEl.innerHTML = embeddedMode
        ? '<strong>DS touch status:</strong> this build now forces the DeSmuME touch-style pointer mode on touch devices. If a game still ignores finger input here, the current webview/browser path may still behave like desktop-only stylus support.'
        : '<strong>DS touch status:</strong> this build now forces the DeSmuME touch-style pointer mode on touch devices. If a game still ignores finger input, DS stylus support may still be desktop-only in this browser for now.';
    } else if (embeddedMode) {
      embeddedWarningEl.hidden = false;
      embeddedWarningEl.innerHTML = '<strong>Embedded mode:</strong> Discord Activity is great for quick play, but browser popout is the reliable path for fullscreen, save-state tools, and the cleanest emulator controls.';
    } else {
      embeddedWarningEl.hidden = true;
    }
  }

  if (core === 'psp' && pspRuntimeInfoEl) {
    let webgl2 = false;
    try {
      const canvas = document.createElement('canvas');
      webgl2 = !!canvas.getContext('webgl2');
    } catch (error) {}
    const sab = typeof window.SharedArrayBuffer === 'function';
    const isolated = window.crossOriginIsolated === true;
    pspRuntimeInfoEl.hidden = false;
    pspRuntimeInfoEl.innerHTML = `<strong>PSP runtime check:</strong> crossOriginIsolated=${isolated}, SharedArrayBuffer=${sab}, WebGL2=${webgl2}. <strong>Preset:</strong> ${getPspPreset().label}.`;
  } else if (pspRuntimeInfoEl) {
    pspRuntimeInfoEl.hidden = true;
  }

  if (fullscreenButtonEl) fullscreenButtonEl.hidden = embeddedMode;

  if (embeddedMode && core === 'psp') {
    if (popoutButtonEl) popoutButtonEl.textContent = 'Browser mode (recommended)';
    if (embeddedFocusButtonEl) embeddedFocusButtonEl.textContent = 'Fill window';
    if (buttonEl) buttonEl.textContent = 'Open PSP in browser';
    return;
  }
  if (embeddedMode) {
    if (popoutButtonEl) popoutButtonEl.textContent = 'Browser mode (fullscreen + save states)';
    if (embeddedFocusButtonEl) embeddedFocusButtonEl.textContent = document.body.classList.contains('embedded-focus-mode') ? 'Exit focus mode' : 'Fill window';
  } else {
    if (popoutButtonEl) popoutButtonEl.textContent = 'Open in browser';
    if (fullscreenButtonEl) fullscreenButtonEl.textContent = 'Fullscreen';
  }
  if (buttonEl) buttonEl.textContent = core === 'psp' ? 'Attempt launch (experimental)' : 'Launch';
}

function syncLaunchState() {
  if (!buttonEl) return;
  buttonEl.disabled = !(selectedFile || selectedGame) || launched;
  if (fullscreenButtonEl) fullscreenButtonEl.disabled = !launched;
  if (embeddedFocusButtonEl) embeddedFocusButtonEl.disabled = !launched;
}

function setEmbeddedFocusMode(enabled) {
  document.documentElement.classList.toggle('embedded-focus-mode', enabled);
  document.body.classList.toggle('embedded-focus-mode', enabled);
  if (embeddedFocusButtonEl) {
    embeddedFocusButtonEl.textContent = enabled ? 'Exit focus mode' : 'Fill window';
  }
}

function syncFullscreenState() {
  if (!frameEl) return;
  frameEl.classList.toggle('is-fullscreen', document.fullscreenElement === frameEl);
  if (fullscreenButtonEl && !embeddedMode) {
    fullscreenButtonEl.textContent = document.fullscreenElement === frameEl ? 'Exit fullscreen' : 'Fullscreen';
  }
}

function getRequestedRoomId() {
  const explicit = String(params.get('room') || '').trim().toLowerCase();
  if (explicit) return explicit;
  if (discordInstanceId) return String(discordInstanceId).trim().toLowerCase();
  return '';
}

function getEffectiveRoomId() {
  return getRequestedRoomId();
}

function shouldShowRoomPanel() {
  return embeddedMode || multiplayerRequested || Boolean(getEffectiveRoomId());
}

function syncRoomAwareNavLinks() {
  const roomId = String(getEffectiveRoomId() || '').trim();
  const clientId = String(params.get('client_id') || DEFAULT_DISCORD_CLIENT_ID || '').trim();
  const selectors = [
    '.embedded-hubbar a[href]',
    '.player-hero a[href]',
  ];

  document.querySelectorAll(selectors.join(',')).forEach((link) => {
    const href = link.getAttribute('href') || '';
    if (!href || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('#')) return;

    const target = new URL(href, window.location.origin);
    if (target.pathname === '/play' || target.pathname.endsWith('/play.html')) {
      const targetCore = String(target.searchParams.get('core') || '').trim().toLowerCase();
      if (roomId) target.searchParams.set('room', roomId);
      if (multiplayerRequested) target.searchParams.set('multiplayer', '1');
      if (embeddedMode && targetCore !== 'psp') target.searchParams.set('embedded', '1');
      if (params.get('activity') === '1' && targetCore !== 'psp') target.searchParams.set('activity', '1');
      if (clientId && targetCore !== 'psp') target.searchParams.set('client_id', clientId);
      link.href = `${target.pathname}${target.search}`;
      return;
    }

    if (target.pathname === '/activity' || target.pathname.endsWith('/activity.html')) {
      if (clientId) target.searchParams.set('client_id', clientId);
      if (params.get('discord') === '1' || embeddedMode) target.searchParams.set('discord', '1');
      link.href = `${target.pathname}${target.search}`;
      return;
    }

    if (target.pathname === '/index.html' || target.pathname === '/arcade' || target.pathname === '/index') {
      if (roomId) target.searchParams.set('room', roomId);
      link.href = `${target.pathname}${target.search}`;
    }
  });
}

function currentRequestedGameId() {
  if (selectedGame?.title) return slugifyTitle(selectedGame.title);
  if (requestedGameKey) return requestedGameKey;
  return '';
}

function currentRequestedGameTitle() {
  return selectedGame?.title || '';
}

function hashStringToPositiveInt(value) {
  let hash = 0;
  const input = String(value || '');
  for (let index = 0; index < input.length; index += 1) {
    hash = ((hash << 5) - hash) + input.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash || 1);
}

function isPhase0MultiplayerTarget() {
  return multiplayerRequested && core === PHASE0_MULTIPLAYER_CORE;
}

function getPhase0MultiplayerGameKey() {
  return currentRequestedGameId() || requestedGameKey || '';
}

function shouldEnableNetplayForCurrentSelection() {
  return isPhase0MultiplayerTarget() && getPhase0MultiplayerGameKey() === PHASE0_MULTIPLAYER_GAME;
}

function getRoomNetplayConfig() {
  const roomId = getEffectiveRoomId();
  if (!roomId || !shouldEnableNetplayForCurrentSelection()) return null;
  const server = String(runtimeConfig.netplay?.server || '').trim();
  if (!server) return null;
  return {
    roomId,
    server,
    iceServers: Array.isArray(runtimeConfig.netplay?.iceServers) ? runtimeConfig.netplay.iceServers : [],
    gameId: hashStringToPositiveInt(`${core}:${PHASE0_MULTIPLAYER_GAME}:${roomId}`),
  };
}

function maybeApplyRoomSelectedGame(state = multiplayerRoomState) {
  if (!state || launched || selectedFile || !state.gameId || core !== state.core) return;
  if (!Array.isArray(library[core]) || !library[core].length) return;

  const viewer = getViewerMember(state);
  if (viewer?.isHost) return;

  const targetKey = String(state.gameId || '').trim().toLowerCase();
  if (!targetKey || roomSyncedSelectionKey === targetKey) return;

  const chosen = library[core].find((entry) => slugifyTitle(entry.title) === targetKey || String(entry.title || '').trim().toLowerCase() === targetKey);
  if (!chosen) return;

  roomSyncedSelectionKey = targetKey;
  setSelectedGame(chosen);
}

async function loadRuntimeConfig() {
  try {
    const response = await fetch('/api/runtime-config', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const loaded = await response.json();
    runtimeConfig.netplay.server = String(loaded?.netplay?.server || '').trim();
    runtimeConfig.netplay.iceServers = Array.isArray(loaded?.netplay?.iceServers) ? loaded.netplay.iceServers : [];
  } catch (error) {
    console.error('Runtime config load failed', error);
  }
}

function sanitizeRoomParticipantList(rawParticipants) {
  return Array.isArray(rawParticipants)
    ? rawParticipants.map((entry) => ({
        id: String(entry?.id || entry?.userId || entry?.user_id || '').trim(),
        displayName: String(entry?.displayName || entry?.global_name || entry?.globalName || entry?.username || entry?.nick || entry?.name || 'Unknown player').trim(),
      })).filter((entry) => entry.id || entry.displayName)
    : [];
}

function createRoomChip(label, warning = false) {
  const chip = document.createElement('span');
  chip.className = `room-chip${warning ? ' warning' : ''}`;
  chip.textContent = label;
  return chip;
}

function getViewerMember(state = multiplayerRoomState) {
  return state?.members?.find((member) => member.clientId === roomViewerId) || null;
}

function roomStateSummary(member) {
  if (!member) return 'Not synced yet';
  if (member.isHost) return `${member.displayName} (host)`;
  if (member.playerSlot) return `${member.displayName} (${member.playerSlot.toUpperCase()})`;
  return `${member.displayName} (spectator)`;
}

function renderRoomParticipants(state = multiplayerRoomState) {
  if (!roomParticipantsEl) return;
  roomParticipantsEl.innerHTML = '';

  const members = Array.isArray(state?.members) ? state.members : [];
  if (!members.length) {
    const empty = document.createElement('p');
    empty.className = 'subtle';
    empty.textContent = 'No synced room members yet. Open this same Activity instance on another account to test the shared room.';
    roomParticipantsEl.appendChild(empty);
    return;
  }

  const viewer = getViewerMember(state);
  const viewerIsHost = viewer?.isHost === true;

  members.forEach((member) => {
    const card = document.createElement('div');
    card.className = 'room-member';

    const head = document.createElement('div');
    head.className = 'room-member-head';

    const name = document.createElement('div');
    name.className = 'room-member-name';
    name.textContent = member.displayName || member.clientId;
    head.appendChild(name);

    const meta = document.createElement('div');
    meta.className = 'room-member-meta';
    meta.appendChild(createRoomChip(member.isHost ? 'Host' : 'Guest', member.isHost));
    meta.appendChild(createRoomChip(member.playerSlot ? member.playerSlot.toUpperCase() : 'Spectator', !member.playerSlot));
    if (member.requestedSlot) meta.appendChild(createRoomChip(`Requested ${String(member.requestedSlot).toUpperCase()}`));
    head.appendChild(meta);
    card.appendChild(head);

    if (viewerIsHost && !member.isHost) {
      const actions = document.createElement('div');
      actions.className = 'room-member-actions';
      ['p2', 'p3', 'p4'].forEach((slot) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `button${member.playerSlot === slot ? ' primary' : ''}`;
        button.textContent = `Grant ${slot.toUpperCase()}`;
        button.addEventListener('click', () => assignRoomSlot(member.clientId, slot));
        actions.appendChild(button);
      });
      const spectatorButton = document.createElement('button');
      spectatorButton.type = 'button';
      spectatorButton.className = 'button';
      spectatorButton.textContent = 'Watch only';
      spectatorButton.addEventListener('click', () => assignRoomSlot(member.clientId, 'spectator'));
      actions.appendChild(spectatorButton);
      card.appendChild(actions);
    }

    roomParticipantsEl.appendChild(card);
  });

  if (Array.isArray(state?.participantSnapshot) && state.participantSnapshot.length) {
    const snapshot = document.createElement('div');
    snapshot.className = 'room-discord-snapshot';
    state.participantSnapshot.forEach((participant) => {
      snapshot.appendChild(createRoomChip(participant.displayName || participant.id || 'Discord viewer'));
    });
    roomParticipantsEl.appendChild(snapshot);
  }
}

function renderRoomState(state = multiplayerRoomState) {
  if (!roomPanelEl) return;
  const visible = shouldShowRoomPanel();
  roomPanelEl.hidden = !visible;
  if (!visible) return;

  const roomId = getEffectiveRoomId();
  const viewer = getViewerMember(state);
  const host = state?.members?.find((member) => member.clientId === state?.hostClientId) || null;

  if (roomInstanceIdEl) roomInstanceIdEl.textContent = roomId || 'Waiting for Discord instance…';
  if (roomSummaryEl) {
    roomSummaryEl.textContent = roomId
      ? 'This panel is the shared-room control layer for the Discord Activity. Watch-only join and host-controlled slot assignment are wired here first.'
      : 'Waiting for a room id from Discord or the URL before the shared-room panel can fully sync.';
  }
  if (roomViewerStateEl) roomViewerStateEl.textContent = viewer ? roomStateSummary(viewer) : `${roomViewerName} (not synced yet)`;
  if (roomHostStateEl) roomHostStateEl.textContent = host ? host.displayName : 'No host yet';
  if (roomGameStateEl) roomGameStateEl.textContent = state?.gameTitle ? `${state.gameTitle}${state?.core ? ` (${String(state.core).toUpperCase()})` : ''}` : 'No active shared game yet.';
  if (roomDebugNoteEl) {
    const participantNote = Array.isArray(state?.participantSnapshot) && state.participantSnapshot.length
      ? `Discord currently reports ${state.participantSnapshot.length} connected participant(s) in this Activity instance.`
      : 'Discord participant snapshots will show up here once the SDK reports them.';
    const netplayNote = getRoomNetplayConfig()
      ? ` Netplay is wired for the hardcoded Smash test and will target ${runtimeConfig.netplay.server}.`
      : (shouldEnableNetplayForCurrentSelection()
        ? ' Netplay launch is selected, but no netplay server is configured yet.'
        : ' Netplay only auto-wires for the Phase 0 Smash test right now.');
    roomDebugNoteEl.textContent = `${participantNote}${netplayNote}`;
  }

  if (roomSlotSummaryEl) {
    roomSlotSummaryEl.innerHTML = '';
    const slots = state?.slots || {};
    ['p1', 'p2', 'p3', 'p4'].forEach((slot) => {
      const occupant = state?.members?.find((member) => member.clientId === slots[slot]);
      roomSlotSummaryEl.appendChild(createRoomChip(`${slot.toUpperCase()}: ${occupant?.displayName || 'open'}`, !occupant));
    });
  }

  if (requestSeatButtonEl) {
    requestSeatButtonEl.disabled = !roomId || !viewer || viewer.isHost === true || Boolean(viewer.playerSlot);
  }
  if (refreshRoomButtonEl) refreshRoomButtonEl.disabled = !roomId;

  renderRoomParticipants(state);
}

async function refreshDiscordRoomParticipants() {
  if (!discordSdkInstance?.commands?.getInstanceConnectedParticipants) return;
  try {
    const payload = await discordSdkInstance.commands.getInstanceConnectedParticipants();
    discordRoomParticipants = sanitizeRoomParticipantList(payload?.participants || payload || []);
  } catch (error) {
    console.error('Discord room participant fetch failed', error);
  }
}

function buildRoomActionUrl(roomId, action, payload = {}) {
  const url = new URL(`/api/rooms/${encodeURIComponent(roomId)}/${action}`, window.location.origin);
  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value == null || value === '') return;
    if (typeof value === 'boolean') {
      url.searchParams.set(key, value ? '1' : '0');
      return;
    }
    if (Array.isArray(value)) {
      if (!value.length) return;
      url.searchParams.set(key, JSON.stringify(value));
      return;
    }
    url.searchParams.set(key, String(value));
  });
  return url.toString();
}

async function roomActionFetch(roomId, action, payload = {}) {
  const preferQueryTransport = embeddedMode;

  if (preferQueryTransport) {
    const compactPayload = { ...payload };
    if (action === 'sync') delete compactPayload.participants;
    const queryUrl = buildRoomActionUrl(roomId, action, compactPayload);
    return fetch(queryUrl, { method: 'GET' });
  }

  const queryUrl = buildRoomActionUrl(roomId, action, payload);
  let response = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/${action}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (response.ok) return response;
  response = await fetch(queryUrl, { method: 'GET' });
  return response;
}

async function describeRoomActionError(response) {
  const contentType = String(response?.headers?.get('content-type') || '').toLowerCase();
  const raw = await response.text().catch(() => '');
  if (contentType.includes('text/html')) return `HTTP ${response.status} Worker exception`;
  const singleLine = String(raw || '').replace(/\s+/g, ' ').trim();
  return `HTTP ${response.status}${singleLine ? ` ${singleLine.slice(0, 240)}` : ''}`;
}

async function syncRoomState(reason = 'poll') {
  const roomId = getEffectiveRoomId();
  if (!roomId) {
    renderRoomState();
    return null;
  }

  await refreshDiscordRoomParticipants();

  const payload = {
    clientId: roomViewerId,
    displayName: roomViewerName,
    instanceId: discordInstanceId || roomId,
    core,
    gameId: currentRequestedGameId(),
    gameTitle: currentRequestedGameTitle(),
    launched,
    participants: discordRoomParticipants,
    reason,
  };

  try {
    const response = await roomActionFetch(roomId, 'sync', payload);
    if (!response.ok) {
      throw new Error(await describeRoomActionError(response));
    }

    multiplayerRoomState = await response.json();
    maybeApplyRoomSelectedGame(multiplayerRoomState);
    renderRoomState(multiplayerRoomState);
    return multiplayerRoomState;
  } catch (error) {
    console.error('Room sync failed', error);
    if (roomSummaryEl) roomSummaryEl.textContent = `Room sync failed right now. ${error?.message || 'The Worker/Durable Object path may need deployment first.'}`;
    renderRoomParticipants(null);
    return null;
  }
}

function startRoomSyncLoop() {
  if (roomSyncTimer) clearInterval(roomSyncTimer);
  if (!shouldShowRoomPanel()) {
    renderRoomState();
    return;
  }
  renderRoomState();
  syncRoomState('boot');
  roomSyncTimer = window.setInterval(() => {
    syncRoomState('poll');
  }, 5000);
}

async function assignRoomSlot(targetId, slot) {
  const roomId = getEffectiveRoomId();
  if (!roomId) return;
  try {
    const response = await roomActionFetch(roomId, 'assign-slot', {
      actorId: roomViewerId,
      targetId,
      slot,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    multiplayerRoomState = await response.json();
    renderRoomState(multiplayerRoomState);
  } catch (error) {
    console.error('Room slot assignment failed', error);
    setStatus(`Slot assignment failed. ${error?.message || 'Make sure the latest Worker build is deployed with the room Durable Object binding.'}`);
  }
}

async function requestRoomSeat(slot = 'p2') {
  const roomId = getEffectiveRoomId();
  if (!roomId) return;
  try {
    const response = await roomActionFetch(roomId, 'request-seat', {
      clientId: roomViewerId,
      slot,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    multiplayerRoomState = await response.json();
    renderRoomState(multiplayerRoomState);
    setStatus('Seat request sent. The host can now promote you from spectator to an active player slot.');
  } catch (error) {
    console.error('Seat request failed', error);
    setStatus(`Could not send a seat request right now. ${error?.message || ''}`.trim());
  }
}

function slugifyTitle(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function setSelectedGame(chosen) {
  const entries = Array.isArray(library[core]) ? library[core] : [];
  selectedGame = chosen;
  if (selectedGame) {
    selectedFile = null;
    if (inputEl) inputEl.value = '';
    if (dropdownEl) {
      const index = entries.indexOf(selectedGame);
      dropdownEl.value = index >= 0 ? String(index) : '';
    }
    setStatus(`Ready to launch curated game: ${selectedGame.title}`);
    if (dropdownNotesEl) {
      const locationNote = isExternalUrl(resolveEntryUrl(selectedGame))
        ? (core === 'psp'
          ? 'This PSP title is loading directly from cloud storage in the browser for reliability.'
          : 'This title is hosted outside GitHub Pages so bigger files can load without bloating the site repo.')
        : null;
      const tierLabel = getWebTierLabel(selectedGame);
      const tierNote = tierLabel
        ? `Web status: ${tierLabel}.`
        : null;
      const archiveWarning = getUnsupportedArchiveMessage(resolveEntryUrl(selectedGame));
      const dsTouchNote = core === 'nds' && isLikelyTouchDevice()
        ? 'Touch device detected, so DS launches use the safer DeSmuME fallback, an older EmulatorJS data build, and forced touch-style stylus settings for better odds.'
        : null;
      dropdownNotesEl.textContent = [selectedGame.notes || 'Curated game selected.', tierNote, locationNote, archiveWarning, dsTouchNote]
        .filter(Boolean)
        .join(' ');
    }
  } else if (selectedFile) {
    if (dropdownEl) dropdownEl.value = '';
    setStatus(`Ready to launch uploaded file: ${selectedFile.name}`);
  } else {
    if (dropdownEl) dropdownEl.value = '';
    const entriesExist = entries.length > 0;
    setStatus(entriesExist ? 'Choose a curated game or upload a file to start.' : 'Upload a file to start.');
    if (dropdownNotesEl) {
      dropdownNotesEl.textContent = entriesExist
        ? 'Pick from the curated list, or ignore it and upload your own file below.'
        : 'No curated games for this emulator yet. Once you send me more files, I can add them here.';
    }
  }
  syncLaunchState();
  if (shouldShowRoomPanel()) syncRoomState('selection');
}

function applyRequestedGame() {
  if (!requestedGameKey) return;
  const entries = Array.isArray(library[core]) ? library[core] : [];
  const chosen = entries.find((entry) => {
    const title = String(entry.title || '').trim().toLowerCase();
    return title === requestedGameKey || slugifyTitle(entry.title) === requestedGameKey;
  });
  if (!chosen) return;
  setSelectedGame(chosen);
  if (autoLaunchRequested && buttonEl && !buttonEl.disabled) {
    buttonEl.click();
  }
}

function populateDropdown() {
  if (!dropdownEl) return;
  const entries = Array.isArray(library[core]) ? library[core] : [];
  dropdownEl.innerHTML = '';

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = entries.length ? 'Choose a curated game…' : 'No curated games added yet';
  dropdownEl.appendChild(placeholder);
  dropdownEl.disabled = !entries.length;

  if (dropdownWrapEl) {
    dropdownWrapEl.hidden = false;
  }

  entries.forEach((entry, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    const suffix = isExternalUrl(resolveEntryUrl(entry)) ? ' (cloud)' : '';
    const tierLabel = getWebTierLabel(entry);
    const tierSuffix = tierLabel ? ` • ${tierLabel}` : '';
    option.textContent = `${entry.title}${suffix}${tierSuffix}`;
    dropdownEl.appendChild(option);
  });

  if (dropdownNotesEl) {
    dropdownNotesEl.textContent = entries.length
      ? 'Pick from the curated list, or ignore it and upload your own file below.'
      : 'No curated games for this emulator yet. Once you send me more files, I can add them here.';
  }
}

async function loadLibrary() {
  try {
    const response = await fetch('data/game-library.json?v=1', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    library = await response.json();
  } catch (error) {
    library = {};
    if (dropdownNotesEl) {
      dropdownNotesEl.textContent = 'Could not load the curated game list just now, but manual uploads still work.';
    }
  }
  populateDropdown();
}

inputEl?.addEventListener('change', () => {
  selectedFile = inputEl.files && inputEl.files[0] ? inputEl.files[0] : null;
  if (selectedFile) {
    selectedGame = null;
    if (dropdownEl) dropdownEl.value = '';
    setStatus(`Ready to launch uploaded file: ${selectedFile.name}`);
  } else if (selectedGame) {
    setStatus(`Ready to launch curated game: ${selectedGame.title}`);
  } else {
    setStatus('Choose a curated game or upload a file to start.');
  }
  syncLaunchState();
});

dropdownEl?.addEventListener('change', () => {
  const entries = Array.isArray(library[core]) ? library[core] : [];
  const chosen = dropdownEl.value === '' ? null : entries[Number(dropdownEl.value)] || null;
  setSelectedGame(chosen);
});

buttonEl?.addEventListener('click', () => {
  if ((!selectedFile && !selectedGame) || launched) return;

  if (embeddedMode && core === 'psp') {
    const standaloneUrl = new URL(window.location.href);
    standaloneUrl.searchParams.delete('embedded');
    setStatus('PSP is browser-first here. Opening the standalone browser version for a better shot at performance.');
    window.open(standaloneUrl.toString(), '_blank', 'noopener,noreferrer');
    return;
  }

  launched = true;
  buttonEl.disabled = true;
  if (inputEl) inputEl.disabled = true;
  if (dropdownEl) dropdownEl.disabled = true;

  let gameUrl = '';
  let gameName = '';
  if (selectedFile) {
    objectUrl = URL.createObjectURL(selectedFile);
    gameUrl = objectUrl;
    gameName = selectedFile.name.replace(/\.[^.]+$/, '');
  } else if (selectedGame) {
    gameUrl = resolveEntryUrl(selectedGame);
    gameName = selectedGame.title;
  }

  if (!gameUrl) {
    setStatus('This curated entry is missing a file URL.');
    launched = false;
    if (buttonEl) buttonEl.disabled = false;
    if (inputEl) inputEl.disabled = false;
    if (dropdownEl) dropdownEl.disabled = false;
    return;
  }

  const unsupportedArchiveMessage = getUnsupportedArchiveMessage(gameUrl);
  if (unsupportedArchiveMessage) {
    setStatus(unsupportedArchiveMessage);
    launched = false;
    if (buttonEl) buttonEl.disabled = false;
    if (inputEl) inputEl.disabled = false;
    if (dropdownEl) dropdownEl.disabled = false;
    return;
  }

  frameEl.classList.remove('empty');
  frameEl.innerHTML = '<div id="game"></div>';

  const runtimeCore = getRuntimeCore();
  const runtimeDataBase = getRuntimeDataBase();
  const pspPreset = core === 'psp' ? getPspPreset() : null;
  const ndsTouchOptions = core === 'nds' && isLikelyTouchDevice() ? NDS_TOUCH_OPTIONS : null;
  const runtimeDefaultOptions = {
    ...(pspPreset?.options || {}),
    ...(ndsTouchOptions || {}),
  };
  const roomNetplay = getRoomNetplayConfig();

  window.EJS_player = '#game';
  window.EJS_core = runtimeCore;
  window.EJS_gameUrl = gameUrl;
  window.EJS_gameName = gameName;
  window.EJS_pathtodata = runtimeDataBase;
  window.EJS_gameID = roomNetplay?.gameId;
  window.EJS_netplayServer = roomNetplay?.server || '';
  window.EJS_netplayICEServers = roomNetplay?.iceServers || [];
  if (pspPreset) applyPspPresetToStorage(gameUrl, gameName, pspPreset);
  if (ndsTouchOptions) applyCoreOptionsToStorage(runtimeCore, gameUrl, gameName, ndsTouchOptions);

  window.EJS_startOnLoaded = true;
  window.EJS_volume = 0.8;
  window.EJS_color = '#2dd46f';
  window.EJS_backgroundColor = '#07110a';
  window.EJS_threads = core === 'psp';
  window.EJS_defaultOptions = Object.keys(runtimeDefaultOptions).length ? runtimeDefaultOptions : undefined;
  window.EJS_disableAutoLang = false;
  window.EJS_cacheConfig = { enabled: true, cacheMaxSizeMB: 1024, cacheMaxAgeMins: 1440 };
  window.EJS_controlScheme = core === 'nds' ? 'nds' : undefined;
  window.EJS_Buttons = embeddedMode
    ? {
        fullscreen: false,
        saveState: false,
        loadState: false,
        quickSave: false,
        quickLoad: false,
      }
    : undefined;

  const script = document.createElement('script');
  script.src = `${runtimeDataBase}loader.js`;
  script.crossOrigin = 'anonymous';
  script.async = true;
  script.addEventListener('load', () => {
    window.setTimeout(focusGameTarget, 150);
    window.setTimeout(focusGameTarget, 900);
    window.setTimeout(focusGameTarget, 1800);
    installNdsTouchBridge();
  });
  document.body.appendChild(script);

  const sourceLabel = isExternalUrl(gameUrl) ? ' from cloud storage' : '';
  const embeddedPspNote = embeddedMode && core === 'psp'
    ? ' Discord Activity adds extra proxy and webview overhead here, so browser popout will usually feel much better.'
    : '';
  const pspPresetNote = core === 'psp'
    ? ` PSP preset active: ${getPspPreset().label}.`
    : '';
  const ndsTouchFallbackNote = core === 'nds' && isLikelyTouchDevice()
    ? ' Touch device detected, so this DS launch is using the safer DeSmuME fallback, a pinned EmulatorJS build, and forced touch-style stylus settings.'
    : '';
  const embeddedFeatureNote = embeddedMode && core !== 'psp'
    ? ' Fullscreen and save-state tools are browser-mode features for now.'
    : '';
  const netplayNote = shouldEnableNetplayForCurrentSelection()
    ? (roomNetplay
      ? ` Netplay is armed for room ${roomNetplay.roomId}, using shared game id ${roomNetplay.gameId}.`
      : ' This is the multiplayer test path, but no netplay server is configured yet, so the room panel will work without real synced gameplay.')
    : '';
  setStatus(`Loading ${gameName}${sourceLabel}… first launch can take a little longer while the browser caches core files.${embeddedPspNote}${pspPresetNote}${ndsTouchFallbackNote}${embeddedFeatureNote}${netplayNote}`);
  syncLaunchState();
  if (shouldShowRoomPanel()) syncRoomState('launch');
});

function toggleEmbeddedFocusMode() {
  const enabled = !document.body.classList.contains('embedded-focus-mode');
  setEmbeddedFocusMode(enabled);
  setStatus(enabled
    ? 'Focus mode enabled. The Discord player is now filling the Activity window more aggressively.'
    : 'Focus mode off. Restored the normal split layout.');
}

fullscreenButtonEl?.addEventListener('click', async () => {
  if (!frameEl || !launched) return;

  try {
    if (document.fullscreenElement === frameEl) {
      await document.exitFullscreen();
    } else {
      await frameEl.requestFullscreen();
    }
    syncFullscreenState();
  } catch (error) {
    setStatus('Fullscreen was blocked here. Use Open in browser for the cleanest full-window mode.');
  }
});

embeddedFocusButtonEl?.addEventListener('click', () => {
  if (!frameEl || !launched) return;
  toggleEmbeddedFocusMode();
});

requestSeatButtonEl?.addEventListener('click', () => {
  requestRoomSeat('p2');
});

refreshRoomButtonEl?.addEventListener('click', () => {
  syncRoomState('manual-refresh');
});

popoutButtonEl?.addEventListener('click', () => {
  const target = new URL(window.location.href);
  target.searchParams.delete('embedded');
  target.searchParams.delete('activity');
  target.searchParams.delete('discord');
  target.searchParams.delete('client_id');
  window.open(target.toString(), '_blank', 'noopener,noreferrer');
});

document.addEventListener('fullscreenchange', syncFullscreenState);

pspPresetEl?.addEventListener('change', () => {
  syncPspPresetUi();
  syncEmbeddedWarnings();
  if (core === 'psp' && selectedGame) {
    setSelectedGame(selectedGame);
  }
});

installKeyboardFocusBridge();
syncPspPresetUi();
syncEmbeddedWarnings();
syncRoomAwareNavLinks();

Promise.allSettled([
  loadRuntimeConfig(),
  connectDiscordSdkIfEmbedded(),
]).then(() => {
  renderRoomState();
});

loadLibrary().then(() => {
  setStatus(core === 'psp'
    ? (embeddedMode
      ? 'Choose a curated game or upload a file to start. PSP inside Discord is experimental and unreliable, so browser popout is recommended if you insist on testing it.'
      : 'Choose a curated game or upload a file to start. PSP is experimental and unreliable right now, so expect failures.')
    : (core === 'nds' && isLikelyTouchDevice()
      ? 'Choose a curated game or upload a file to start. On touch devices DS now uses a safer fallback path and forced touch-style stylus settings, but some browsers may still behave like desktop-only stylus support.'
      : 'Choose a curated game or upload a file to start.'));
  syncLaunchState();
  applyRequestedGame();
});

window.addEventListener('beforeunload', () => {
  if (roomSyncTimer) clearInterval(roomSyncTimer);
  if (objectUrl) URL.revokeObjectURL(objectUrl);
});
