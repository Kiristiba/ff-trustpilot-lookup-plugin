export const DEFAULT_CACHE_TTL_HOURS = 168; // 7 Days
export const CACHE_TTL = 1000 * 60 * 60 * DEFAULT_CACHE_TTL_HOURS;

const RATING_COLORS = {
  5: "#00b67a",
  4: "#73cf11",
  3: "#ffce00",
  2: "#ff8622",
  1: "#ff3722",
  0: "#c8c8c8" // Grey for unrated
};

export function getRatingColor(score) {
  const s = Math.round(score || 0);
  return RATING_COLORS[s] || RATING_COLORS[0];
}

export function getBaseDomain(hostname) {
  if (!hostname || !hostname.includes('.')) return null;
  const parts = hostname.split('.');
  if (parts.length <= 2) return hostname;

  const secondLevelTlds = ['co', 'com', 'net', 'org', 'gov', 'edu', 'ac'];
  const sld = parts[parts.length - 2];

  if (secondLevelTlds.includes(sld) && parts.length >= 3) {
    return parts.slice(-3).join('.');
  }
  return parts.slice(-2).join('.');
}

export function updateBadge(score, tabId) {
  if (!tabId || !score) {
    chrome.action.setBadgeText({ text: "", tabId: tabId });
    return;
  }

  const color = getRatingColor(score);

  chrome.action.setBadgeText({
    text: score.toString(),
    tabId: tabId
  });

  chrome.action.setBadgeBackgroundColor({
    color: color,
    tabId: tabId
  });
}