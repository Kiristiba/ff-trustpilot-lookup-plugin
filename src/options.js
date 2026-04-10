import { updateBadge, DEFAULT_CACHE_TTL_HOURS, clearCache } from './utils.js';

const localeSelect = document.getElementById('locale');
const cacheTtlSelect = document.getElementById('cacheTtl');
const saveBtn = document.getElementById('save');
const statusMsg = document.getElementById('status');

// Helper to show visual feedback
function showStatus(text) {
  statusMsg.textContent = text;
  statusMsg.style.opacity = '1';

  // Fade out after 2 seconds
  setTimeout(() => {
    statusMsg.style.opacity = '0';
  }, 2000);
}

// Load current settings
chrome.storage.local.get({ 
  locale: 'www.trustpilot.com', 
  cacheTtlHours: DEFAULT_CACHE_TTL_HOURS 
}, (res) => {
  localeSelect.value = res.locale;
  cacheTtlSelect.value = res.cacheTtlHours.toString();
});

saveBtn.onclick = async () => {
  const newLocale = localeSelect.value;
  const newCacheTtlHours = parseInt(cacheTtlSelect.value, 10);

  const current = await chrome.storage.local.get(['locale', 'cacheTtlHours']);
  const localeChanged = current.locale !== newLocale;

  if (localeChanged) {
    await clearCache();
    await chrome.storage.local.set({
      locale: newLocale,
      cacheTtlHours: newCacheTtlHours
    });

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) updateBadge(null, tab.id);

    showStatus('Saved & Cache Cleared ✓');
  } else {
    await chrome.storage.local.set({ cacheTtlHours: newCacheTtlHours });
    showStatus('Settings saved ✓');
  }
};