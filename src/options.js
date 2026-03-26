import { updateBadge } from './utils.js';

const select = document.getElementById('locale');
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

// Load current setting
chrome.storage.local.get({ locale: 'www.trustpilot.com' }, (res) => {
  select.value = res.locale;
});

saveBtn.onclick = async () => {
  const newLocale = select.value;

  // 1. Clear everything
  await chrome.storage.local.clear();

  // 2. Set new locale
  await chrome.storage.local.set({ locale: newLocale });

  // 3. Reset badge on the current options tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) updateBadge(null, tab.id);

  // 4. Show the visual "Checkmark" or message
  showStatus('Saved & Cache Cleared ✓');
};