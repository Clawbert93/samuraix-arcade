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
    blurb: 'Upload a legal .nds file or homebrew build. This is the zero-cost version, so compatibility is good-not-perfect and some titles may still want extra BIOS or firmware help.',
    caveat: 'DS note: some titles may need extra BIOS or firmware for best compatibility. This page stays legal by not bundling any of that.',
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
    blurb: 'Upload a legal PSP game you own, or use the dropdown once curated games are added. PSP works in this browser stack, but it is a heavier target than the older consoles here.',
    caveat: 'PSP note: this is heavier than the other retro systems and Safari is not a good target for it. Desktop Chromium-type browsers are the safer bet.',
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
const emulatorDataBase = embeddedMode ? '/emu/stable/data/' : 'https://cdn.emulatorjs.org/stable/data/';

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
const buttonEl = document.getElementById('launchButton');
const fullscreenButtonEl = document.getElementById('fullscreenButton');
const popoutButtonEl = document.getElementById('popoutButton');
const statusEl = document.getElementById('launchStatus');
const frameEl = document.getElementById('gameFrame');
const embeddedWarningEl = document.getElementById('embeddedWarning');
const pspRuntimeInfoEl = document.getElementById('pspRuntimeInfo');

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

function installNdsTouchBridge() {
  if (!frameEl || core !== 'nds') return;

  const relayTouchAsMouse = (target) => {
    if (!(target instanceof HTMLElement) || target.dataset.ndsTouchBridgeInstalled === '1') return;
    target.dataset.ndsTouchBridgeInstalled = '1';
    target.style.touchAction = 'none';

    const dispatchMouse = (type, touch) => {
      const pointTarget = document.elementFromPoint(touch.clientX, touch.clientY);
      const eventTarget = frameEl.contains(pointTarget) ? pointTarget : target;
      eventTarget.dispatchEvent(new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        clientX: touch.clientX,
        clientY: touch.clientY,
        screenX: touch.screenX,
        screenY: touch.screenY,
        button: 0,
        buttons: type === 'mouseup' ? 0 : 1,
      }));
    };

    target.addEventListener('touchstart', (event) => {
      const touch = event.changedTouches?.[0];
      if (!touch) return;
      dispatchMouse('mousemove', touch);
      dispatchMouse('mousedown', touch);
      event.preventDefault();
    }, { passive: false });

    target.addEventListener('touchmove', (event) => {
      const touch = event.changedTouches?.[0];
      if (!touch) return;
      dispatchMouse('mousemove', touch);
      event.preventDefault();
    }, { passive: false });

    const endTouch = (event) => {
      const touch = event.changedTouches?.[0];
      if (!touch) return;
      dispatchMouse('mouseup', touch);
      dispatchMouse('click', touch);
      event.preventDefault();
    };

    target.addEventListener('touchend', endTouch, { passive: false });
    target.addEventListener('touchcancel', endTouch, { passive: false });
  };

  const attachBridge = () => {
    relayTouchAsMouse(frameEl.querySelector('canvas') || frameEl.querySelector('#game'));
  };

  attachBridge();
  const observer = new MutationObserver(attachBridge);
  observer.observe(frameEl, { childList: true, subtree: true });
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

function getPspStorageKey(gameUrl, gameName) {
  let identifier = '1-psp';
  if (typeof gameName === 'string' && gameName) {
    identifier += `-${gameName}`;
  } else if (typeof gameUrl === 'string' && gameUrl !== 'game' && !gameUrl.startsWith('blob:')) {
    identifier += `-${gameUrl}`;
  }
  return `ejs-${identifier}-settings`;
}

function applyPspPresetToStorage(gameUrl, gameName, preset) {
  if (!window.localStorage || !preset?.options) return;
  const storageKey = getPspStorageKey(gameUrl, gameName);
  let existing = { controlSettings: {}, settings: {}, cheats: [] };
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || '{}');
    if (parsed && typeof parsed === 'object') existing = { ...existing, ...parsed };
  } catch (error) {}
  existing.settings = { ...(existing.settings || {}), ...preset.options };
  if (!Array.isArray(existing.cheats)) existing.cheats = [];
  if (!existing.controlSettings || typeof existing.controlSettings !== 'object') existing.controlSettings = {};
  localStorage.setItem(storageKey, JSON.stringify(existing));
}

function syncPspPresetUi() {
  const show = core === 'psp';
  if (pspPresetWrapEl) pspPresetWrapEl.hidden = !show;
  if (pspPresetNotesEl) {
    pspPresetNotesEl.hidden = !show;
    if (show) pspPresetNotesEl.textContent = getPspPreset().note;
  }
}

function syncEmbeddedWarnings() {
  if (embeddedWarningEl) {
    if (embeddedMode && core === 'psp') {
      embeddedWarningEl.hidden = false;
      embeddedWarningEl.innerHTML = '<strong>PSP in Discord:</strong> This is the hardest-case combo, huge game downloads plus a heavy emulator inside a webview. Launch now routes browser-first instead of pretending the embedded path is the best option.';
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

  if (embeddedMode && core === 'psp') {
    if (popoutButtonEl) popoutButtonEl.textContent = 'Open in browser (recommended)';
    if (buttonEl) buttonEl.textContent = 'Open PSP in browser';
    return;
  }
  if (popoutButtonEl) popoutButtonEl.textContent = 'Open in browser';
  if (buttonEl) buttonEl.textContent = 'Launch';
}

function syncLaunchState() {
  if (!buttonEl) return;
  buttonEl.disabled = !(selectedFile || selectedGame) || launched;
  if (fullscreenButtonEl) fullscreenButtonEl.disabled = !launched;
}

function syncFullscreenState() {
  if (!frameEl) return;
  frameEl.classList.toggle('is-fullscreen', document.fullscreenElement === frameEl);
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
      dropdownNotesEl.textContent = [selectedGame.notes || 'Curated game selected.', tierNote, locationNote, archiveWarning]
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

  window.EJS_player = '#game';
  window.EJS_core = core;
  window.EJS_gameUrl = gameUrl;
  window.EJS_gameName = gameName;
  window.EJS_pathtodata = emulatorDataBase;
  const pspPreset = core === 'psp' ? getPspPreset() : null;
  if (pspPreset) applyPspPresetToStorage(gameUrl, gameName, pspPreset);

  window.EJS_startOnLoaded = true;
  window.EJS_volume = 0.8;
  window.EJS_color = '#2dd46f';
  window.EJS_backgroundColor = '#07110a';
  window.EJS_threads = core === 'psp';
  window.EJS_defaultOptions = pspPreset ? pspPreset.options : undefined;
  window.EJS_disableAutoLang = false;
  window.EJS_cacheConfig = { enabled: true, cacheMaxSizeMB: 1024, cacheMaxAgeMins: 1440 };

  const script = document.createElement('script');
  script.src = `${emulatorDataBase}loader.js`;
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
  setStatus(`Loading ${gameName}${sourceLabel}… first launch can take a little longer while the browser caches core files.${embeddedPspNote}${pspPresetNote}`);
  syncLaunchState();
});

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

popoutButtonEl?.addEventListener('click', () => {
  window.open(window.location.href, '_blank', 'noopener,noreferrer');
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

loadLibrary().then(() => {
  setStatus(embeddedMode && core === 'psp'
    ? 'Choose a curated game or upload a file to start. PSP inside Discord is experimental, so browser popout is recommended for speed.'
    : 'Choose a curated game or upload a file to start.');
  syncLaunchState();
  applyRequestedGame();
});

window.addEventListener('beforeunload', () => {
  if (objectUrl) URL.revokeObjectURL(objectUrl);
});
