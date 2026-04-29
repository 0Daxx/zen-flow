// Chrome Storage API wrapper for user preferences

const DEFAULT_SETTINGS = {
  // Camera & Detection Settings
  enableEmotionDetection: true,
  enablePostureDetection: true,
  emotionCaptureInterval: 30000, // 30 seconds
  postureMode: 'low-power', // 'low-power' (5fps) or 'high-performance' (30fps)
  
  // Notification Settings
  enableBreakNotifications: true,
  enablePostureAlerts: true,
  enableStressAlerts: true,
  notificationSound: true,
  
  // Break Settings
  breakReminderInterval: 45, // minutes
  enforceBreaks: true,
  breakTypes: ['quick', 'stretch', 'walk'],
  
  // Website Tracking
  enableWebsiteTracking: true,
  trackedSites: [], // empty means all sites
  excludedSites: [], // sites to exclude from tracking
  
  // Privacy
  dataRetentionDays: 90,
  allowAnalytics: true,
  
  // Meditation App Integration
  meditationAppUrl: '', // URL to launch meditation app
  autoLaunchMeditation: false,
  
  // UI Preferences
  theme: 'blue',
  showEmotionWidget: true,
  showPostureScore: true,
  dashboardView: 'today' // 'today', 'weekly', 'site-analytics'
};

/**
 * Get user settings from Chrome Storage
 */
export async function getUserSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(DEFAULT_SETTINGS, (result) => {
      resolve(result);
    });
  });
}

/**
 * Update user settings
 */
export async function updateUserSettings(settings) {
  return new Promise((resolve) => {
    chrome.storage.local.set(settings, () => {
      resolve(true);
    });
  });
}

/**
 * Get a specific setting value
 */
export async function getSetting(key) {
  const settings = await getUserSettings();
  return settings[key];
}

/**
 * Set a specific setting value
 */
export async function setSetting(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, () => {
      resolve(true);
    });
  });
}

/**
 * Reset all settings to defaults
 */
export async function resetToDefaults() {
  return new Promise((resolve) => {
    chrome.storage.local.clear(() => {
      chrome.storage.local.set(DEFAULT_SETTINGS, () => {
        resolve(true);
      });
    });
  });
}

/**
 * Check if a site should be tracked
 */
export async function shouldTrackSite(domain) {
  const settings = await getUserSettings();
  
  if (!settings.enableWebsiteTracking) {
    return false;
  }
  
  // Check if site is in excluded list
  if (settings.excludedSites.includes(domain)) {
    return false;
  }
  
  // If trackedSites is specified, only track those
  if (settings.trackedSites.length > 0) {
    return settings.trackedSites.includes(domain);
  }
  
  return true;
}

/**
 * Add site to exclusion list
 */
export async function excludeSite(domain) {
  const settings = await getUserSettings();
  
  if (!settings.excludedSites.includes(domain)) {
    settings.excludedSites.push(domain);
    await updateUserSettings({ excludedSites: settings.excludedSites });
  }
  
  return true;
}

/**
 * Remove site from exclusion list
 */
export async function includeSite(domain) {
  const settings = await getUserSettings();
  
  settings.excludedSites = settings.excludedSites.filter(s => s !== domain);
  await updateUserSettings({ excludedSites: settings.excludedSites });
  
  return true;
}

/**
 * Listen for settings changes
 */
export function onSettingsChanged(callback) {
  chrome.storage.onChanges((changes, namespace) => {
    if (namespace === 'local') {
      callback(changes);
    }
  });
}

export { DEFAULT_SETTINGS };
