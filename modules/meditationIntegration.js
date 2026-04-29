// Meditation App Integration Module

import { STORES } from '../storage/indexedDB.js';

let meditationAppUrl = '';

/**
 * Set meditation app URL
 */
export function setMeditationAppUrl(url) {
  meditationAppUrl = url;
}

/**
 * Get recommended meditation based on stress level
 */
export function getRecommendedMeditation(stressLevel) {
  if (stressLevel >= 90) {
    return {
      type: 'guided',
      duration: 10,
      label: '10-min guided meditation',
      description: 'Deep relaxation and stress relief'
    };
  } else if (stressLevel >= 75) {
    return {
      type: 'body-scan',
      duration: 5,
      label: '5-min body scan',
      description: 'Release physical tension'
    };
  } else if (stressLevel >= 60) {
    return {
      type: 'breathing',
      duration: 2,
      label: '2-min breathing exercise',
      description: 'Quick calm and refocus'
    };
  } else {
    return {
      type: 'breathing',
      duration: 2,
      label: '2-min breathing exercise',
      description: 'Maintain your calm state'
    };
  }
}

/**
 * Launch meditation app with specific session
 */
export async function launchMeditation(meditationType = null, stressLevel = 0) {
  let url = meditationAppUrl;
  
  // If no URL set, use default meditation placeholder
  if (!url) {
    url = 'https://meditation-app.local';
  }
  
  // Get recommended meditation if not specified
  if (!meditationType) {
    const recommendation = getRecommendedMeditation(stressLevel);
    meditationType = recommendation.type;
  }
  
  // Add query parameters for session type
  const separator = url.includes('?') ? '&' : '?';
  const fullUrl = `${url}${separator}session=${meditationType}&source=guidance-guru`;
  
  // Open in new tab
  chrome.tabs.create({ url: fullUrl, active: true });
  
  // Log meditation start
  await logMeditationSession(meditationType, stressLevel);
  
  return {
    launched: true,
    url: fullUrl,
    meditationType,
    stressLevel
  };
}

/**
 * Log meditation session start
 */
async function logMeditationSession(meditationType, stressLevel) {
  try {
    const record = {
      id: `meditation_${Date.now()}`,
      timestamp: Date.now(),
      meditation_type: meditationType,
      stress_level_before: stressLevel,
      completed: false,
      session_date: new Date().toISOString().split('T')[0]
    };
    
    chrome.runtime.sendMessage({
      action: 'addRecord',
      storeName: STORES.MEDITATION_LOGS,
      record: record
    });
  } catch (error) {
    console.error('Failed to log meditation session:', error);
  }
}

/**
 * Complete meditation session
 */
export async function completeMeditation(sessionId, stressLevelAfter = null) {
  try {
    const record = {
      id: sessionId,
      timestamp: parseInt(sessionId.replace('meditation_', '')),
      meditation_type: 'unknown', // Would need to retrieve from original record
      stress_level_before: null,
      stress_level_after: stressLevelAfter,
      completed: true,
      completed_at: Date.now(),
      session_date: new Date().toISOString().split('T')[0]
    };
    
    chrome.runtime.sendMessage({
      action: 'updateRecord',
      storeName: STORES.MEDITATION_LOGS,
      record: record
    });
    
    return { completed: true };
  } catch (error) {
    console.error('Failed to complete meditation:', error);
    return { completed: false, error };
  }
}

/**
 * Get meditation statistics
 */
export async function getMeditationStatistics(days = 7) {
  try {
    const startDate = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    const response = await chrome.runtime.sendMessage({
      action: 'getRecords',
      storeName: STORES.MEDITATION_LOGS,
      options: { startDate }
    });
    
    const sessions = response || [];
    
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.completed).length;
    
    // Group by type
    const byType = {};
    for (const session of sessions) {
      const type = session.meditation_type || 'unknown';
      if (!byType[type]) {
        byType[type] = 0;
      }
      byType[type]++;
    }
    
    // Calculate completion rate
    const completionRate = totalSessions > 0
      ? Math.round((completedSessions / totalSessions) * 100)
      : 0;
    
    // Calculate stress reduction (for completed sessions with before/after)
    const sessionsWithStressData = sessions.filter(
      s => s.stress_level_before !== null && s.stress_level_after !== null
    );
    
    let avgStressReduction = 0;
    if (sessionsWithStressData.length > 0) {
      const totalReduction = sessionsWithStressData.reduce((sum, s) => {
        return sum + (s.stress_level_before - s.stress_level_after);
      }, 0);
      avgStressReduction = Math.round(totalReduction / sessionsWithStressData.length);
    }
    
    return {
      totalSessions,
      completedSessions,
      completionRate,
      byType,
      avgStressReduction,
      sessions
    };
  } catch (error) {
    console.error('Failed to get meditation statistics:', error);
    return {
      totalSessions: 0,
      completedSessions: 0,
      completionRate: 0,
      byType: {},
      avgStressReduction: 0,
      sessions: []
    };
  }
}

/**
 * Listen for meditation completion messages from the app
 */
export function listenForMeditationCompletion(callback) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'meditationCompleted') {
      const { sessionId, stressLevelAfter, meditationType } = message.data;
      
      completeMeditation(sessionId, stressLevelAfter).then(() => {
        if (callback) {
          callback({ sessionId, stressLevelAfter, meditationType });
        }
        sendResponse({ success: true });
      });
      
      return true; // Keep channel open for async response
    }
  });
}

/**
 * Send message to meditation app (if open)
 */
export function sendMessageToMeditationApp(message) {
  chrome.tabs.query({ url: meditationAppUrl + '*' }, (tabs) => {
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, message);
    }
  });
}
