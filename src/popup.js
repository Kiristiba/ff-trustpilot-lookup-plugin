import { getBaseDomain, updateBadge, getRatingColor, DEFAULT_CACHE_TTL_HOURS } from './utils.js';

const TRUSTPILOT_ORIGIN = 'https://*.trustpilot.com/*';

let currentTabId = null;

async function checkPermission() {
  return await chrome.permissions.contains({ origins: [TRUSTPILOT_ORIGIN] });
}

async function requestPermission() {
  return await chrome.permissions.request({ origins: [TRUSTPILOT_ORIGIN] });
}

function showPermissionPrompt() {
  const loadingEl = document.getElementById('loading');
  loadingEl.textContent = 'Missing permissions. This extension requires permission to read data from trustpilot.com. Click the button below to request permissions.';

  const btn = document.createElement('button');
  btn.textContent = 'Grant Permission';
  btn.className = 'btn';
  btn.style.marginTop = '10px';
  btn.onclick = async () => {
    const granted = await requestPermission();
    if (granted) {
      window.location.reload();
    } else {
      loadingEl.textContent = 'Permission denied';
    }
  };
  loadingEl.appendChild(btn);
}

async function init() {
  const hasPermission = await checkPermission();
  if (!hasPermission) {
    showPermissionPrompt();
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTabId = tab.id;

  const url = new URL(tab.url);
  const baseDomain = getBaseDomain(url.hostname);

  fetchTrustpilotData(baseDomain, url.hostname);
}

async function getCacheTtl() {
  const settings = await chrome.storage.local.get({ cacheTtlHours: DEFAULT_CACHE_TTL_HOURS });
  return settings.cacheTtlHours * 60 * 60 * 1000;
}

async function fetchTrustpilotData(domain, originalHostname) {
  const loadingEl = document.getElementById('loading');
  loadingEl.textContent = `Checking ${domain}...`;

  // 1. Check Cache
  const cache = await chrome.storage.local.get(domain);
  const cacheTtl = await getCacheTtl();
  if (cache[domain] && (Date.now() - cache[domain].timestamp < cacheTtl)) {
    const cachedData = cache[domain].data;
    updateBadge(cachedData.score.toString(), currentTabId);
    renderUI(cachedData, domain);
    return;
  }

  // 2. Fetch Live Data
  const settings = await chrome.storage.local.get({ locale: 'www.trustpilot.com' });
  const tpUrl = `https://${settings.locale}/review/${domain}`;

  try {
    const response = await fetch(tpUrl);
    if (!response.ok) throw new Error('Not found');

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const jsonData = JSON.parse(doc.getElementById('__NEXT_DATA__').textContent);
    const businessUnit = jsonData.props.pageProps.businessUnit;

    const data = {
      name: businessUnit.displayName,
      score: businessUnit.trustScore,
      stars: businessUnit.stars,
      reviews: businessUnit.numberOfReviews,
      url: tpUrl
    };

    // Save to Cache
    await chrome.storage.local.set({ [domain]: { data, timestamp: Date.now() } });

    updateBadge(data.score.toString(), currentTabId); // <-- Update badge on live fetch
    renderUI(data, domain);

  } catch (e) {
    loadingEl.textContent = `No profile for: ${domain}.`;
    if (domain !== originalHostname) {
      const retryBtn = document.createElement('button');
      retryBtn.textContent = `Try specific: ${originalHostname}`;
      retryBtn.style.marginTop = "10px";
      retryBtn.onclick = () => fetchTrustpilotData(originalHostname, originalHostname);
      loadingEl.appendChild(retryBtn);
    }
  }
}

function renderUI(data, domain) {
  document.getElementById('loading').classList.add('hidden');
  document.getElementById('content').classList.remove('hidden');
  document.getElementById('business-name').textContent = data.name || domain;
  document.getElementById('domain-name').textContent = domain;

  const color = getRatingColor(data.score);
  const ratingEl = document.getElementById('rating-val');

  ratingEl.textContent = `${data.score} / 5`;
  ratingEl.style.color = color;

  document.getElementById('review-count').textContent = `${data.reviews.toLocaleString()} reviews`;
  document.getElementById('tp-link').href = data.url;
}

init();