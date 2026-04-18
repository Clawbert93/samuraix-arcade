const DEFAULT_DISCORD_CLIENT_ID = '1494677350439452733';
const statusEl = document.getElementById('activityStatus');
const discordDetectedEl = document.getElementById('discordDetected');
const discordAuthStateEl = document.getElementById('discordAuthState');

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

async function init() {
  const params = new URLSearchParams(window.location.search);
  const clientId = params.get('client_id') || DEFAULT_DISCORD_CLIENT_ID;
  const insideDiscord = isEmbeddedContext() || params.get('discord') === '1';

  setText(discordDetectedEl, insideDiscord ? 'Yes, embedded context detected.' : 'No, running as a standalone preview.');

  if (!insideDiscord) {
    setText(discordAuthStateEl, 'Standalone browser preview, Discord SDK not required.');
    setText(statusEl, 'Minimal browser preview loaded.');
    return;
  }

  try {
    const { DiscordSDK } = await import('/assets/vendor/discord-embedded-app-sdk.bundle.mjs');
    const discordSdk = new DiscordSDK(clientId);
    window.__samuraixDiscordSdk = discordSdk;
    await discordSdk.ready();
    setText(discordAuthStateEl, 'Discord SDK connected.');
    setText(statusEl, 'Minimal Discord Activity shell is connected and waiting.');
  } catch (error) {
    console.error('Discord Activity SDK init failed', error);
    setText(discordAuthStateEl, 'SDK init failed.');
    setText(statusEl, 'Minimal shell loaded, but the Discord SDK handshake failed.');
  }
}

init();
