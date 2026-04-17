const SYSTEMS = {
  nds: {
    title: 'Nintendo DS browser player',
    blurb: 'Upload a legal .nds file or homebrew build. This is the zero-cost version, so compatibility is good-not-perfect and some titles may still want extra BIOS or firmware help.',
    caveat: 'DS note: some titles may need extra BIOS or firmware for best compatibility. This page stays legal by not bundling any of that.',
    links: [
      ['Nintendo DS homebrew on itch.io', 'https://itch.io/games/tag-nintendo-ds'],
      ['DS-Homebrew wiki', 'https://wiki.ds-homebrew.com/'],
      ['GameBrew Nintendo DS homebrew list', 'https://www.gamebrew.org/wiki/List_of_DS_homebrew_applications'],
    ],
  },
  gba: {
    title: 'Game Boy Advance browser player',
    blurb: 'Upload a legal .gba file or homebrew build. GBA is usually the smoother, simpler option in-browser.',
    caveat: 'GBA note: saves stay in this browser only unless we later add a backend.',
    links: [
      ['GBA homebrew on itch.io', 'https://itch.io/games/tag-gameboy-advance'],
      ['GameBrew GBA homebrew list', 'https://www.gamebrew.org/wiki/List_of_GBA_homebrew_applications'],
      ['gbajs project page', 'https://github.com/endrift/gbajs'],
    ],
  },
  n64: {
    title: 'Nintendo 64 browser player',
    blurb: 'Upload a legal N64 ROM you own. N64 fits this free browser setup pretty nicely for casual play.',
    caveat: 'N64 note: compatibility varies by game and browser, but this is one of the more realistic higher-end additions in the free stack.',
    links: [
      ['EmulatorJS Nintendo 64 docs', 'https://emulatorjs.org/docs/systems/nintendo-64/'],
      ['n64js project', 'https://github.com/hulkholden/n64js'],
      ['Retro browser emulation overview', 'https://emulation.gametechwiki.com/index.php/Emulators_on_browsers'],
    ],
  },
  psx: {
    title: 'PlayStation 1 browser player',
    blurb: 'Upload a legal PS1 image you own. PS1 is realistic in this free browser setup, but a proper BIOS helps compatibility a lot.',
    caveat: 'PS1 note: common BIOS files are often needed for best compatibility, and this site does not bundle any BIOS files.',
    links: [
      ['EmulatorJS PlayStation docs', 'https://emulatorjs.org/docs/systems/playstation/'],
      ['PlayStation homebrew and dev resources', 'https://www.psxdev.net/'],
      ['Retro homebrew resources on itch.io', 'https://itch.io/games/tag-playstation'],
    ],
  },
};

const params = new URLSearchParams(window.location.search);
const core = SYSTEMS[params.get('core')] ? params.get('core') : 'nds';
const config = SYSTEMS[core];

const titleEl = document.getElementById('systemTitle');
const blurbEl = document.getElementById('systemBlurb');
const caveatEl = document.getElementById('systemCaveat');
const linksEl = document.getElementById('legalLinks');
const inputEl = document.getElementById('romInput');
const buttonEl = document.getElementById('launchButton');
const statusEl = document.getElementById('launchStatus');
const frameEl = document.getElementById('gameFrame');

if (titleEl) titleEl.textContent = config.title;
if (blurbEl) blurbEl.textContent = config.blurb;
if (caveatEl) caveatEl.textContent = config.caveat;
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
let objectUrl = null;
let launched = false;

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

inputEl?.addEventListener('change', () => {
  selectedFile = inputEl.files && inputEl.files[0] ? inputEl.files[0] : null;
  buttonEl.disabled = !selectedFile;
  if (selectedFile) {
    setStatus(`Ready to launch ${selectedFile.name}`);
  } else {
    setStatus('Choose a ROM file to start.');
  }
});

buttonEl?.addEventListener('click', () => {
  if (!selectedFile || launched) return;
  launched = true;
  buttonEl.disabled = true;
  inputEl.disabled = true;
  objectUrl = URL.createObjectURL(selectedFile);

  frameEl.classList.remove('empty');
  frameEl.innerHTML = '<div id="game"></div>';

  window.EJS_player = '#game';
  window.EJS_core = core;
  window.EJS_gameUrl = objectUrl;
  window.EJS_gameName = selectedFile.name.replace(/\.[^.]+$/, '');
  window.EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/';
  window.EJS_startOnLoaded = true;
  window.EJS_volume = 0.8;
  window.EJS_color = '#2dd46f';
  window.EJS_backgroundColor = '#07110a';
  window.EJS_threads = false;
  window.EJS_disableAutoLang = false;
  window.EJS_cacheConfig = { enabled: true, cacheMaxSizeMB: 1024, cacheMaxAgeMins: 1440 };

  const script = document.createElement('script');
  script.src = 'https://cdn.emulatorjs.org/stable/data/loader.js';
  script.async = true;
  document.body.appendChild(script);

  setStatus('Loading emulator… first launch can take a little longer while the browser caches core files.');
});

window.addEventListener('beforeunload', () => {
  if (objectUrl) URL.revokeObjectURL(objectUrl);
});
