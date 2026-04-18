const envEl = document.getElementById('envResults');
const fetchEl = document.getElementById('fetchResults');

function addRow(el, label, value, ok = true) {
  const div = document.createElement('div');
  div.className = 'note-box' + (ok ? '' : ' warning-box');
  div.innerHTML = `<strong>${label}:</strong> ${value}`;
  el.appendChild(div);
}

async function checkFetch(label, url, opts = {}) {
  try {
    const res = await fetch(url, opts);
    addRow(fetchEl, label, `HTTP ${res.status} (${res.type || 'unknown'})`, res.ok || res.status === 206);
  } catch (error) {
    addRow(fetchEl, label, `FAILED: ${error}`, false);
  }
}

(async function init() {
  addRow(envEl, 'Origin', window.location.origin);
  addRow(envEl, 'User agent', navigator.userAgent);
  addRow(envEl, 'crossOriginIsolated', String(window.crossOriginIsolated), window.crossOriginIsolated === true);
  addRow(envEl, 'SharedArrayBuffer exposed', String(typeof window.SharedArrayBuffer === 'function'), typeof window.SharedArrayBuffer === 'function');

  let webgl2 = false;
  try {
    const canvas = document.createElement('canvas');
    webgl2 = !!canvas.getContext('webgl2');
  } catch (error) {}
  addRow(envEl, 'WebGL2 available', String(webgl2), webgl2 === true);

  await checkFetch('PPSSPP assets zip', 'https://cdn.emulatorjs.org/stable/data/cores/ppsspp-assets.zip', { method: 'HEAD', mode: 'cors' });
  await checkFetch('PPSSPP thread core', 'https://cdn.emulatorjs.org/stable/data/cores/ppsspp-thread-wasm.data', { method: 'HEAD', mode: 'cors' });
  await checkFetch('Sample PSP game (R2)', 'https://pub-2c5587529e4249efbcf882d5d3697d95.r2.dev/psp/Grand_Theft_Auto_Vice_City_Stories.zip', { method: 'HEAD', mode: 'cors' });
})();
