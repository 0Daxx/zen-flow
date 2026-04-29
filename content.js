// Content Script for Guidance Guru Extension

let currentDomain = '';
let trackingStartTime = null;
let emotionData = null;
let postureData = null;
let breakModalVisible = false;

// Initialize content script
async function initialize() {
  console.log('Guidance Guru content script loaded');
  
  // Get current domain
  currentDomain = window.location.hostname;
  trackingStartTime = Date.now();
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener(handleMessage);
  
  // Track page visibility changes
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Track before unload
  window.addEventListener('beforeunload', saveTrackingData);
  
  console.log('Content script initialized for:', currentDomain);
}

// Handle messages from background/popup
function handleMessage(message, sender, sendResponse) {
  switch (message.action) {
    case 'tabActivated':
    case 'urlChanged':
      // Save previous tracking data
      if (currentDomain && trackingStartTime) {
        saveTrackingData();
      }
      
      // Start new tracking
      currentDomain = message.domain || window.location.hostname;
      trackingStartTime = Date.now();
      break;
      
    case 'triggerBreak':
      showBreakEnforcement(message);
      break;
      
    case 'openBreakPage':
      openFullBreakPage(message.breakType);
      break;
      
    case 'startQuickBreak':
      startQuickBreak();
      break;
      
    case 'launchMeditation':
      launchMeditation();
      break;
      
    case 'siteExcluded':
      showSiteExcludedNotification(message.domain);
      break;
      
    case 'showPostureAlert':
      showPostureAlertUI(message.score, message.issues);
      break;
      
    case 'showStressAlert':
      showStressAlertUI(message.emotion, message.confidence);
      break;
      
    default:
      break;
  }
  
  sendResponse({ received: true });
}

// Handle page visibility change
function handleVisibilityChange() {
  if (document.hidden) {
    // Page is hidden, pause tracking
    saveTrackingData();
  } else {
    // Page is visible again, resume tracking
    trackingStartTime = Date.now();
  }
}

// Save tracking data before navigation or unload
function saveTrackingData() {
  if (!currentDomain || !trackingStartTime) return;
  
  const timeSpent = Math.floor((Date.now() - trackingStartTime) / 1000);
  
  if (timeSpent > 0) {
    chrome.runtime.sendMessage({
      action: 'logWebsiteActivity',
      domain: currentDomain,
      data: {
        timeSpent,
        start: trackingStartTime,
        end: Date.now(),
        emotion: emotionData?.emotion || 'unknown',
        posture: postureData?.score || 100,
        breaksTaken: 0
      }
    }).catch(() => {
      // Background script might not be available
    });
  }
}

// Show break enforcement modal
function showBreakEnforcement(data) {
  if (breakModalVisible) return;
  
  breakModalVisible = true;
  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'gg-break-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.9);
    z-index: 2147483647;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  
  overlay.innerHTML = `
    <div style="
      background: white;
      border-radius: 16px;
      padding: 40px;
      max-width: 500px;
      width: 90%;
      text-align: center;
    ">
      <h2 style="color: #2563eb; margin: 0 0 16px 0; font-size: 28px;">🧘 Time for a Break!</h2>
      <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
        You've been stressed with poor posture for a while.<br/>
        It's time to take care of yourself.
      </p>
      <div style="background: #dbeafe; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
        <p style="margin: 0; color: #2563eb; font-weight: 500;">
          Recommended: ${getRecommendedBreak(data.emotion?.emotion)}
        </p>
      </div>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <button id="gg-break-quick" style="
          background: #2563eb; color: white; border: none;
          padding: 14px 24px; border-radius: 8px;
          font-size: 16px; font-weight: 500; cursor: pointer;
        ">Quick Break (2 min)</button>
        <button id="gg-break-stretch" style="
          background: #0ea5e9; color: white; border: none;
          padding: 14px 24px; border-radius: 8px;
          font-size: 16px; font-weight: 500; cursor: pointer;
        ">Stretch Guide (3 min)</button>
        <button id="gg-break-walk" style="
          background: #10b981; color: white; border: none;
          padding: 14px 24px; border-radius: 8px;
          font-size: 16px; font-weight: 500; cursor: pointer;
        ">Walk Break (5 min)</button>
      </div>
      <p style="margin-top: 20px; color: #9ca3af; font-size: 12px;">
        Please select a break option to continue
      </p>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Add button handlers
  document.getElementById('gg-break-quick').addEventListener('click', () => selectBreak('quick'));
  document.getElementById('gg-break-stretch').addEventListener('click', () => selectBreak('stretch'));
  document.getElementById('gg-break-walk').addEventListener('click', () => selectBreak('walk'));
}

// Get recommended break type
function getRecommendedBreak(emotion) {
  if (['angry', 'stressed'].includes(emotion)) {
    return 'Walk Break (5 min)';
  }
  return 'Quick Break (2 min)';
}

// Handle break selection
function selectBreak(breakType) {
  const overlay = document.getElementById('gg-break-overlay');
  if (overlay) {
    overlay.innerHTML = `
      <div style="
        background: white;
        border-radius: 16px;
        padding: 40px;
        max-width: 400px;
        width: 90%;
        text-align: center;
      ">
        <h3 style="color: #10b981; margin: 0 0 16px 0;">✅ Break Started!</h3>
        <p style="color: #6b7280; font-size: 16px;">
          Take your ${breakType} break now.<br/>
          This tab will be ready when you return.
        </p>
        <div id="gg-break-timer" style="
          margin: 24px 0;
          font-size: 48px;
          font-weight: bold;
          color: #2563eb;
        ">${getBreakDuration(breakType)}</div>
      </div>
    `;
  }
  
  // Start timer
  startBreakTimer(breakType);
  
  // Notify background script
  chrome.runtime.sendMessage({
    action: 'breakStarted',
    breakType
  });
}

// Get break duration in seconds
function getBreakDuration(breakType) {
  const durations = { quick: 120, stretch: 180, walk: 300 };
  return formatTime(durations[breakType] || 120);
}

// Format time in MM:SS
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Start break timer
function startBreakTimer(breakType) {
  let remaining = { quick: 120, stretch: 180, walk: 300 }[breakType] || 120;
  
  const timerElement = document.getElementById('gg-break-timer');
  
  const interval = setInterval(() => {
    remaining--;
    
    if (timerElement) {
      timerElement.textContent = formatTime(remaining);
    }
    
    if (remaining <= 0) {
      clearInterval(interval);
      completeBreak();
    }
  }, 1000);
}

// Complete break
function completeBreak() {
  const overlay = document.getElementById('gg-break-overlay');
  if (overlay) {
    overlay.innerHTML = `
      <div style="
        background: white;
        border-radius: 16px;
        padding: 40px;
        max-width: 400px;
        width: 90%;
        text-align: center;
      ">
        <h3 style="color: #10b981; margin: 0 0 16px 0;">🎉 Break Complete!</h3>
        <p style="color: #6b7280; font-size: 16px; margin-bottom: 24px;">
          Great job taking care of yourself!<br/>
          Ready to get back to work?
        </p>
        <button id="gg-break-resume" style="
          background: #2563eb; color: white; border: none;
          padding: 14px 32px; border-radius: 8px;
          font-size: 16px; font-weight: 500; cursor: pointer;
        ">Resume Work</button>
      </div>
    `;
    
    document.getElementById('gg-break-resume').addEventListener('click', () => {
      overlay.remove();
      breakModalVisible = false;
      
      chrome.runtime.sendMessage({
        action: 'breakCompleted'
      });
    });
  }
}

// Start quick break from context menu
function startQuickBreak() {
  showBreakEnforcement({ emotion: { emotion: 'neutral' } });
}

// Open full break page in new tab
function openFullBreakPage(breakType = 'quick') {
  // Send message to background to open the break page
  chrome.runtime.sendMessage({
    action: 'openBreakPage',
    breakType: breakType
  });
}

// Launch meditation
function launchMeditation() {
  chrome.runtime.sendMessage({
    action: 'launchMeditation'
  });
}

// Show site excluded notification
function showSiteExcludedNotification(domain) {
  showNotification(`${domain} excluded from tracking`, 'success');
}

// Show posture alert UI
function showPostureAlertUI(score, issues) {
  showNotification(`⚠️ Posture Alert: Score ${score}/100`, 'warning', 10000);
}

// Show stress alert UI
function showStressAlertUI(emotion, confidence) {
  showNotification(`😰 High stress detected (${Math.round(confidence * 100)}%)`, 'warning', 15000);
}

// Show notification toast
function showNotification(message, type = 'info', duration = 5000) {
  const container = document.getElementById('gg-notification-container') || createNotificationContainer();
  
  const toast = document.createElement('div');
  toast.style.cssText = `
    background: white;
    border-left: 4px solid ${type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#2563eb'};
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    min-width: 280px;
    margin-bottom: 10px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    color: #374151;
    animation: slideIn 0.3s ease-out;
  `;
  
  toast.textContent = message;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Create notification container
function createNotificationContainer() {
  const container = document.createElement('div');
  container.id = 'gg-notification-container';
  container.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 2147483646;
    display: flex;
    flex-direction: column;
  `;
  document.body.appendChild(container);
  return container;
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
if (!document.getElementById('gg-content-styles')) {
  style.id = 'gg-content-styles';
  document.head.appendChild(style);
}

// Update emotion and posture data
export function updateEmotionData(data) {
  emotionData = data;
}

export function updatePostureData(data) {
  postureData = data;
}

// Initialize on load
initialize();
