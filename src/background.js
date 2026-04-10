import { getBaseDomain, updateBadge, DEFAULT_CACHE_TTL_HOURS } from './utils.js';

async function getCacheTtl() {
  const settings = await chrome.storage.local.get({ cacheTtlHours: DEFAULT_CACHE_TTL_HOURS });
  return settings.cacheTtlHours * 60 * 60 * 1000;
}

async function checkCacheAndSetBadge(tabId, urlString) {
  if (!urlString || !urlString.startsWith('http')) {
    chrome.action.setBadgeText({ text: "", tabId: tabId });
    return;
  }

  const url = new URL(urlString);
  const domain = getBaseDomain(url.hostname);

  const cache = await chrome.storage.local.get(domain);
  const cacheTtl = await getCacheTtl();

  if (cache[domain] && (Date.now() - cache[domain].timestamp < cacheTtl)) {
    updateBadge(cache[domain].data.score.toString(), tabId);
  } else {
    // If not in cache, keep the icon clean (Privacy!)
    updateBadge("", tabId);
  }
}

// Listen for tab switching
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    checkCacheAndSetBadge(activeInfo.tabId, tab.url);
  });
});

// Listen for navigation within a tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    checkCacheAndSetBadge(tabId, tab.url);
  }
});