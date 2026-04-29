// Popup Script for Guidance Guru Extension

import { getUserSettings, updateUserSettings } from './storage/chromeStorage.js';

// DOM Elements
const emotionIcon = document.getElementById('emotion-icon');
const emotionText = document.getElementById('emotion-text');
const emotionConfidence = document.getElementById('emotion-confidence');
const emotionIndicator = document.getElementById('emotion-indicator');
const emotionColorBar = document.getElementById('emotion-color-bar');

const postureScoreEl = document.getElementById('posture-score');
const postureProgress = document.getElementById('posture-progress');
const postureStatus = document.getElementById('posture-status');

const stressIndexEl = document.getElementById('stress-index');
const avgPostureEl = document.getElementById('avg-posture');
const breaksTakenEl = document.getElementById('breaks-taken');
const activeSiteEl = document.getElementById('active-site');

const currentDomainEl = document.getElementById('current-domain');
const sessionTimeEl = document.getElementById('session-time');

const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings');
const saveSettingsBtn = document.getElementById('save-settings');

const breakNowBtn = document.getElementById('break-now-btn');
const meditateBtn = document.getElementById('meditate-btn');
const dashboardBtn = document.getElementById('dashboard-btn');

// Settings inputs
const enableEmotionCheckbox = document.getElementById('enable-emotion');
const enablePostureCheckbox = document.getElementById('enable-posture');
const enableBreaksCheckbox = document.getElementById('enable-breaks');
const enableTrackingCheckbox = document.getElementById('enable-tracking');
const meditationUrlInput = document.getElementById('meditation-url');

// State
let currentEmotion = null;
let currentPostureScore = 100;
let sessionStartTime = Date.now();
let sessionTimer = null;

// Emotion icons and colors
const emotionData = {
  happy: { icon: '😊', color: 'positive' },
  calm: { icon: '😌', color: 'positive' },
  neutral: { icon: '😐', color: 'neutral' },
  focused: { icon: '🎯', color: 'neutral' },
  surprised: { icon: '😮', color: 'neutral' },
  stressed: { icon: '😰', color: 'negative' },
  angry: { icon: '😠', color: 'negative' },
  sad: { icon: '😢', color: 'negative' },
  fearful: { icon: '😨', color: 'negative' },
  disgusted: { icon: '🤢', color: 'negative' }
};

// Initialize popup
async function initialize() {
  console.log('Popup initialized');
  
  // Load settings
  await loadSettings();
  
  // Get current state from background
  await getCurrentState();
  
  // Load today's summary
  await loadTodaysSummary();
  
  // Start session timer
  startSessionTimer();
  
  // Set up event listeners
  setupEventListeners();
  
  // Request camera permission if needed
  await checkCameraPermission();
}

// Load user settings
async function loadSettings() {
  const settings = await getUserSettings();
  
  enableEmotionCheckbox.checked = settings.enableEmotionDetection;
  enablePostureCheckbox.checked = settings.enablePostureDetection;
  enableBreaksCheckbox.checked = settings.enableBreakNotifications;
  enableTrackingCheckbox.checked = settings.enableWebsiteTracking;
  meditationUrlInput.value = settings.meditationAppUrl || '';
}

// Get current state from background script
async function getCurrentState() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getCurrentState' });
    
    if (response && response.emotion) {
      updateEmotionDisplay(response.emotion);
    }
    
    if (response.postureScore !== undefined) {
      updatePostureDisplay(response.postureScore);
    }
  } catch (error) {
    console.log('Could not get state from background:', error);
    // Set default values
    updateEmotionDisplay({ emotion: 'neutral', confidence: 0 });
    updatePostureDisplay(100);
  }
}

// Load today's summary
async function loadTodaysSummary() {
  try {
    // Get break statistics
    const breakResponse = await chrome.runtime.sendMessage({
      action: 'getRecords',
      storeName: 'break_history',
      options: {}
    });
    
    const breaks = breakResponse?.data || [];
    const today = new Date().toISOString().split('T')[0];
    const todaysBreaks = breaks.filter(b => b.session_date === today).length;
    
    breaksTakenEl.textContent = todaysBreaks;
    
    // Get active tab domain
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      const domain = new URL(tab.url).hostname;
      currentDomainEl.textContent = domain;
      activeSiteEl.textContent = domain.length > 8 ? domain.substring(0, 8) + '...' : domain;
    }
    
    // Placeholder values for stress index and avg posture
    stressIndexEl.textContent = '--';
    avgPostureEl.textContent = '--';
    
  } catch (error) {
    console.error('Error loading summary:', error);
  }
}

// Start session timer
function startSessionTimer() {
  sessionStartTime = Date.now();
  
  if (sessionTimer) {
    clearInterval(sessionTimer);
  }
  
  sessionTimer = setInterval(() => {
    const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
    sessionTimeEl.textContent = formatTime(elapsed);
  }, 1000);
}

// Format time in MM:SS
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Update emotion display
function updateEmotionDisplay(emotion) {
  currentEmotion = emotion;
  
  const data = emotionData[emotion.emotion] || emotionData.neutral;
  
  emotionIcon.textContent = data.icon;
  emotionText.textContent = capitalizeFirst(emotion.emotion);
  emotionConfidence.textContent = `${Math.round((emotion.confidence || 0) * 100)}%`;
  
  // Update indicator color
  emotionIndicator.className = `emotion-indicator ${data.color}`;
  emotionColorBar.className = `emotion-color-bar ${data.color}`;
}

// Update posture display
function updatePostureDisplay(score) {
  currentPostureScore = score;
  
  postureScoreEl.textContent = score;
  
  // Update circular progress
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (score / 100) * circumference;
  postureProgress.style.strokeDashoffset = offset;
  
  // Update status
  if (score >= 80) {
    postureStatus.textContent = 'Good';
    postureStatus.className = 'posture-status good';
  } else if (score >= 60) {
    postureStatus.textContent = 'Moderate';
    postureStatus.className = 'posture-status moderate';
  } else {
    postureStatus.textContent = 'Poor';
    postureStatus.className = 'posture-status poor';
  }
}

// Check camera permission
async function checkCameraPermission() {
  try {
    const result = await chrome.runtime.sendMessage({ action: 'requestPermissions' });
    
    if (!result.granted) {
      updateStatusIndicator(false);
    }
  } catch (error) {
    console.log('Permission check failed:', error);
  }
}

// Update status indicator
function updateStatusIndicator(active) {
  const statusDot = document.getElementById('detection-status');
  const statusText = document.getElementById('status-text');
  
  if (active) {
    statusDot.classList.add('active');
    statusText.textContent = 'Active';
  } else {
    statusDot.classList.remove('active');
    statusText.textContent = 'Inactive';
  }
}

// Setup event listeners
function setupEventListeners() {
  // Settings modal
  settingsBtn.addEventListener('click', () => {
    settingsModal.classList.remove('hidden');
  });
  
  closeSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
  });
  
  saveSettingsBtn.addEventListener('click', saveSettings);
  
  // Quick actions
  breakNowBtn.addEventListener('click', startQuickBreak);
  meditateBtn.addEventListener('click', launchMeditation);
  
  // Dashboard button
  dashboardBtn.addEventListener('click', openDashboard);
  
  // Close modal on outside click
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      settingsModal.classList.add('hidden');
    }
  });
}

// Save settings
async function saveSettings() {
  const settings = {
    enableEmotionDetection: enableEmotionCheckbox.checked,
    enablePostureDetection: enablePostureCheckbox.checked,
    enableBreakNotifications: enableBreaksCheckbox.checked,
    enableWebsiteTracking: enableTrackingCheckbox.checked,
    meditationAppUrl: meditationUrlInput.value.trim()
  };
  
  await updateUserSettings(settings);
  
  settingsModal.classList.add('hidden');
  
  // Show success feedback
  showSaveSuccess();
}

// Show save success feedback
function showSaveSuccess() {
  const originalText = saveSettingsBtn.textContent;
  saveSettingsBtn.textContent = '✓ Saved!';
  saveSettingsBtn.style.background = '#10b981';
  
  setTimeout(() => {
    saveSettingsBtn.textContent = 'Save Settings';
    saveSettingsBtn.style.background = '';
  }, 1500);
}

// Start quick break
function startQuickBreak() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'startQuickBreak' });
    }
  });
  
  window.close();
}

// Launch meditation
function launchMeditation() {
  chrome.runtime.sendMessage({ action: 'launchMeditation' });
  window.close();
}

// Open dashboard
function openDashboard() {
  chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
  window.close();
}

// Utility: Capitalize first letter
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Listen for updates from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'emotionUpdate':
      updateEmotionDisplay(message.emotion);
      break;
    case 'postureUpdate':
      updatePostureDisplay(message.score);
      break;
  }
  
  sendResponse({ received: true });
});

// Initialize on load
initialize();
