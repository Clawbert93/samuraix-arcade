const DEFAULT_DISCORD_CLIENT_ID = '1494677350439452733';
const statusEl = document.getElementById('activityStatus');
const discordDetectedEl = document.getElementById('discordDetected');
const discordAuthStateEl = document.getElementById('discordAuthState');

function setText(el, value) {
  if (el) el.textContent = value;
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const clientId = params.get('client_id') || DEFAULT_DISCORD_CLIENT_ID;
  const insideDiscord = window.location !== window.parent.location || params.get('discord') === '1';
  const sdkImportUrl = insideDiscord ? '/esm/@discord/embedded-app-sdk' : 'https://esm.sh/@discord/embedded-app-sdk';
  setText(discordDetectedEl, insideDiscord ? 'Yes, embedded context detected.' : 'No, running as a standalone preview.');

  try {
    const { DiscordSDK } = await import(sdkImportUrl);
    const discordSdk = new DiscordSDK(clientId);
    await discordSdk.ready();
    setText(discordAuthStateEl, 'Discord SDK connected.');
    setText(statusEl, 'Discord Activity shell is connected. From here we can wire launch presence, channel-aware invites, and richer party-room behavior.');
  } catch (error) {
    console.error('Discord Activity SDK init failed', error);
    setText(discordAuthStateEl, 'SDK init failed. Check console once the portal mappings and Activity entry are saved.');
    setText(statusEl, 'Activity shell loaded, but Discord SDK auth did not complete yet.');
  }
}

init();
