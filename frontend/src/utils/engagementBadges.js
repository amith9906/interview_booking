const STORAGE_KEY = 'engagementBadges';

const loadBadges = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

const persistBadges = (badges) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(badges));
};

export const getBadges = () => loadBadges();

export const addBadge = (badge) => {
  const normalized = badge.trim();
  if (!normalized) return;
  const badges = loadBadges();
  if (!badges.includes(normalized)) {
    badges.push(normalized);
    persistBadges(badges);
  }
};

export const clearBadges = () => {
  localStorage.removeItem(STORAGE_KEY);
};
