// Background Service Worker for Guidance Guru Extension

import { initDB, addRecord, getRecords, updateRecord, purgeOldData } from './storage/indexedDB.js';
import { getUserSettings } from './storage/chromeStorage.js';
import { STORES } from './storage/indexedDB.js';

// State management
let emotionDetectionActive = false;
let postureDetectionActive = false;
let currentEmotion = null;
let currentPostureScore = 100;
let stressStartTime = null;
let breakCheckInterval = null;
let dataPurgeInterval = null;

// Initialize extension
async function initialize() {
  console.log('Guidance Guru: Initializing...');
  
  try {
    // Initialize IndexedDB
    await initDB();
    console.log('IndexedDB initialized');
    
    // Load user settings
    const settings = await getUserSettings();
    console.log('User settings loaded:', settings);
    
    // Start periodic data purge (daily)
    startDataPurge();
    
    // Start break check interval
    startBreakCheck();
    
    // Create context menu for quick actions
    createContextMenus();
    
    console.log('Guidance Guru: Initialization complete');
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

// Start break check interval
function startBreakCheck() {
  if (breakCheckInterval) {
    clearInterval(breakCheckInterval);
  }
  
  breakCheckInterval = setInterval(async () => {
    await checkBreakConditions();
  }, 60000); // Check every minute
}

// Start data purge interval (daily)
function startDataPurge() {
  if (dataPurgeInterval) {
    clearInterval(dataPurgeInterval);
  }
  
  dataPurgeInterval = setInterval(async () => {
    await purgeOldData(90);
    console.log('Old data purged');
  }, 24 * 60 * 60 * 1000); // Daily
}

// Check break conditions
async function checkBreakConditions() {
  try {
    const settings = await getUserSettings();
    
    if (!settings.enableBreakNotifications || !settings.enforceBreaks) {
      return;
    }
    
    const isStressed = ['stressed', 'angry', 'sad', 'fearful'].includes(currentEmotion?.emotion);
    const poorPosture = currentPostureScore < 60;
    
    if (isStressed && poorPosture) {
      if (!stressStartTime) {
        stressStartTime = Date.now();
      }
      
      const stressDuration = Date.now() - stressStartTime;
      const threshold = 45 * 60 * 1000; // 45 minutes
      
      if (stressDuration >= threshold) {
        // Trigger break
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: 'triggerBreak',
              emotion: currentEmotion,
              postureScore: currentPostureScore,
              stressDuration
            });
          }
        });
      }
    } else {
      stressStartTime = null;
    }
  } catch (error) {
    console.error('Break check error:', error);
  }
}

// Create context menus
function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'gg-quick-break',
      title: 'Take a Quick Break',
      contexts: ['page']
    });
    
    chrome.contextMenus.create({
      id: 'gg-meditate',
      title: 'Start Meditation',
      contexts: ['page']
    });
    
    chrome.contextMenus.create({
      id: 'gg-exclude-site',
      title: 'Exclude this site from tracking',
      contexts: ['page']
    });
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  switch (info.menuItemId) {
    case 'gg-quick-break':
      chrome.tabs.sendMessage(tab.id, { action: 'startQuickBreak' });
      break;
    case 'gg-meditate':
      chrome.tabs.sendMessage(tab.id, { action: 'launchMeditation' });
      break;
    case 'gg-exclude-site':
      const domain = new URL(tab.url).hostname;
      await excludeSite(domain);
      chrome.tabs.sendMessage(tab.id, { 
        action: 'siteExcluded', 
        domain 
      });
      break;
  }
});

// Exclude site from tracking
async function excludeSite(domain) {
  const settings = await getUserSettings();
  
  if (!settings.excludedSites.includes(domain)) {
    settings.excludedSites.push(domain);
    await chrome.storage.local.set({ excludedSites: settings.excludedSites });
  }
}

// Message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender, sendResponse);
  return true; // Keep channel open for async responses
});

// Handle messages from content scripts and popup
async function handleMessage(message, sender, sendResponse) {
  try {
    switch (message.action) {
      case 'addRecord':
        const addId = await addRecord(message.storeName, message.record);
        sendResponse({ success: true, id: addId });
        break;
        
      case 'getRecords':
        const records = await getRecords(message.storeName, message.options);
        sendResponse({ success: true, data: records });
        break;
        
      case 'updateRecord':
        await updateRecord(message.storeName, message.record);
        sendResponse({ success: true });
        break;
        
      case 'deleteRecord':
        // Would need to implement delete in indexedDB.js
        sendResponse({ success: false, error: 'Not implemented' });
        break;
        
      case 'getCurrentState':
        sendResponse({
          emotion: currentEmotion,
          postureScore: currentPostureScore,
          emotionDetectionActive,
          postureDetectionActive
        });
        break;
        
      case 'updateEmotion':
        currentEmotion = message.emotion;
        
        // Store emotion record
        if (message.emotion) {
          const record = {
            id: `emotion_${Date.now()}`,
            timestamp: Date.now(),
            emotion: message.emotion.emotion,
            confidence: message.emotion.confidence,
            posture_score: currentPostureScore,
            website_active: message.website || 'unknown',
            session_date: new Date().toISOString().split('T')[0]
          };
          
          await addRecord(STORES.EMOTION_SESSIONS, record);
        }
        
        sendResponse({ success: true });
        break;
        
      case 'updatePosture':
        currentPostureScore = message.score;
        
        // Store posture record
        if (message.score !== undefined) {
          const record = {
            id: `posture_${Date.now()}`,
            timestamp: Date.now(),
            score: message.score,
            issues: message.issues || [],
            session_date: new Date().toISOString().split('T')[0]
          };
          
          await addRecord(STORES.POSTURE_RECORDS, record);
        }
        
        sendResponse({ success: true });
        break;
        
      case 'logWebsiteActivity':
        await logWebsiteActivity(message.domain, message.data);
        sendResponse({ success: true });
        break;
        
      case 'requestPermissions':
        requestCameraPermission().then(granted => {
          sendResponse({ granted });
        });
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Message handling error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Log website activity
async function logWebsiteActivity(domain, data) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const recordId = `website_${domain}_${today}`;
    
    // Try to get existing record
    const existing = await getRecords(STORES.WEBSITE_ACTIVITY, {});
    let record = existing.find(r => r.id === recordId);
    
    if (record) {
      // Update existing record
      record.total_time_seconds += data.timeSpent || 0;
      record.sessions.push({
        start: data.start || Date.now(),
        end: data.end || Date.now(),
        emotion: data.emotion || 'unknown',
        posture: data.posture || 100
      });
      record.breaks_taken += data.breaksTaken || 0;
      
      // Recalculate stress index
      const stressEmotions = ['stressed', 'angry', 'sad', 'fearful'];
      const stressSessions = record.sessions.filter(s => stressEmotions.includes(s.emotion)).length;
      record.stress_index = record.sessions.length > 0
        ? Math.round((stressSessions / record.sessions.length) * 100)
        : 0;
      
      await updateRecord(STORES.WEBSITE_ACTIVITY, record);
    } else {
      // Create new record
      const stressEmotions = ['stressed', 'angry', 'sad', 'fearful'];
      const stressIndex = data.emotion && stressEmotions.includes(data.emotion) ? 100 : 0;
      
      const newRecord = {
        id: recordId,
        website_domain: domain,
        date: today,
        total_time_seconds: data.timeSpent || 0,
        sessions: [{
          start: data.start || Date.now(),
          end: data.end || Date.now(),
          emotion: data.emotion || 'unknown',
          posture: data.posture || 100
        }],
        stress_index: stressIndex,
        breaks_taken: data.breaksTaken || 0
      };
      
      await addRecord(STORES.WEBSITE_ACTIVITY, newRecord);
    }
  } catch (error) {
    console.error('Website activity logging error:', error);
  }
}

// Request camera permission
async function requestCameraPermission() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('Camera permission denied:', error);
    return false;
  }
}

// Tab activation handler for website tracking
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    const domain = new URL(tab.url).hostname;
    
    // Notify content script of tab change
    chrome.tabs.sendMessage(activeInfo.tabId, {
      action: 'tabActivated',
      domain
    });
  } catch (error) {
    // Tab might not be ready yet
  }
});

// Tab update handler
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    const domain = new URL(tab.url).hostname;
    
    chrome.tabs.sendMessage(tabId, {
      action: 'urlChanged',
      domain
    }).catch(() => {
      // Content script might not be loaded
    });
  }
});

// Installation handler
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Guidance Guru installed:', details.reason);
  
  if (details.reason === 'install') {
    // Open welcome page or set default settings
    chrome.storage.local.set({
      enableEmotionDetection: true,
      enablePostureDetection: true,
      enableBreakNotifications: true,
      enableWebsiteTracking: true,
      dataRetentionDays: 90
    });
  }
});

// Start initialization
initialize();

console.log('Guidance Guru background worker loaded');
