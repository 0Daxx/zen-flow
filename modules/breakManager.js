// Break Manager Module - Handles break enforcement logic

import { STORES } from '../storage/indexedDB.js';
import { getUserSettings } from '../storage/chromeStorage.js';

let stressStartTime = null;
let breakEnforced = false;
let breakTimer = null;
let currentBreak = null;

/**
 * Show break page in full screen
 */
export async function showBreakPage(breakType = 'quick') {
  try {
    // Create a new tab with the break page
    const url = chrome.runtime.getURL('break.html');
    
    await chrome.tabs.create({
      url: url,
      active: true
    });
    
    return true;
  } catch (error) {
    console.error('Failed to open break page:', error);
    return false;
  }
}

/**
 * Check if break should be triggered based on posture and stress
 */
export async function checkBreakTrigger(emotion, postureScore) {
  const settings = await getUserSettings();
  
  if (!settings.enableBreakNotifications || !settings.enforceBreaks) {
    return { shouldTrigger: false };
  }
  
  const isStressed = ['stressed', 'angry', 'sad', 'fearful'].includes(emotion);
  const poorPosture = postureScore < 60;
  
  // Track when stress started
  if (isStressed) {
    if (!stressStartTime) {
      stressStartTime = Date.now();
    }
  } else {
    stressStartTime = null;
  }
  
  // Check trigger conditions
  let shouldTrigger = false;
  let triggerReason = '';
  
  if (poorPosture && isStressed && stressStartTime) {
    const stressDuration = Date.now() - stressStartTime;
    const threshold = 45 * 60 * 1000; // 45 minutes
    
    if (stressDuration >= threshold) {
      shouldTrigger = true;
      triggerReason = 'Extended stress with poor posture';
    }
  }
  
  return {
    shouldTrigger,
    triggerReason,
    stressDuration: stressStartTime ? Date.now() - stressStartTime : 0,
    postureScore,
    emotion
  };
}

/**
 * Start a break session
 */
export async function startBreak(breakType) {
  const settings = await getUserSettings();
  
  const breakTypes = {
    quick: { duration: 2 * 60 * 1000, label: 'Quick Break (2 min)' },
    stretch: { duration: 3 * 60 * 1000, label: 'Stretch Guide (3 min)' },
    walk: { duration: 5 * 60 * 1000, label: 'Walk Break (5 min)' }
  };
  
  const selectedBreak = breakTypes[breakType] || breakTypes.quick;
  
  currentBreak = {
    type: breakType,
    startTime: Date.now(),
    endTime: Date.now() + selectedBreak.duration,
    duration: selectedBreak.duration,
    label: selectedBreak.label,
    completed: false
  };
  
  breakEnforced = true;
  
  // Log break start
  await logBreakHistory(currentBreak);
  
  return currentBreak;
}

/**
 * Complete the current break
 */
export async function completeBreak() {
  if (!currentBreak) return null;
  
  currentBreak.completed = true;
  currentBreak.actualEndTime = Date.now();
  
  // Update break history
  await updateBreakHistory(currentBreak);
  
  const completedBreak = { ...currentBreak };
  currentBreak = null;
  breakEnforced = false;
  
  return completedBreak;
}

/**
 * Cancel the current break
 */
export async function cancelBreak() {
  if (!currentBreak) return null;
  
  currentBreak.cancelled = true;
  currentBreak.actualEndTime = Date.now();
  
  // Update break history
  await updateBreakHistory(currentBreak);
  
  const cancelledBreak = { ...currentBreak };
  currentBreak = null;
  breakEnforced = false;
  
  return cancelledBreak;
}

/**
 * Get current break status
 */
export function getBreakStatus() {
  if (!currentBreak) {
    return {
      inBreak: false,
      breakType: null,
      timeRemaining: 0,
      progress: 0
    };
  }
  
  const now = Date.now();
  const timeRemaining = Math.max(0, currentBreak.endTime - now);
  const elapsed = now - currentBreak.startTime;
  const progress = Math.min(100, (elapsed / currentBreak.duration) * 100);
  
  return {
    inBreak: true,
    breakType: currentBreak.type,
    timeRemaining,
    progress,
    label: currentBreak.label
  };
}

/**
 * Check if break timer has completed
 */
export function checkBreakCompletion() {
  if (!currentBreak) return false;
  
  const now = Date.now();
  if (now >= currentBreak.endTime) {
    return true;
  }
  
  return false;
}

/**
 * Log break to history
 */
async function logBreakHistory(breakData) {
  try {
    const record = {
      id: `break_${Date.now()}`,
      timestamp: breakData.startTime,
      break_type: breakData.type,
      duration: breakData.duration,
      label: breakData.label,
      completed: false,
      session_date: new Date().toISOString().split('T')[0]
    };
    
    // Send to background script for IndexedDB storage
    chrome.runtime.sendMessage({
      action: 'addRecord',
      storeName: STORES.BREAK_HISTORY,
      record: record
    });
  } catch (error) {
    console.error('Failed to log break history:', error);
  }
}

/**
 * Update break history record
 */
async function updateBreakHistory(breakData) {
  try {
    const record = {
      id: `break_${breakData.startTime}`,
      timestamp: breakData.startTime,
      break_type: breakData.type,
      duration: breakData.duration,
      label: breakData.label,
      completed: breakData.completed,
      cancelled: breakData.cancelled || false,
      actualEndTime: breakData.actualEndTime,
      actualDuration: breakData.actualEndTime 
        ? breakData.actualEndTime - breakData.startTime 
        : breakData.duration,
      session_date: new Date().toISOString().split('T')[0]
    };
    
    // Send to background script for IndexedDB storage
    chrome.runtime.sendMessage({
      action: 'updateRecord',
      storeName: STORES.BREAK_HISTORY,
      record: record
    });
  } catch (error) {
    console.error('Failed to update break history:', error);
  }
}

/**
 * Get break statistics
 */
export async function getBreakStatistics(days = 7) {
  try {
    const startDate = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    const response = await chrome.runtime.sendMessage({
      action: 'getRecords',
      storeName: STORES.BREAK_HISTORY,
      options: { startDate }
    });
    
    const breaks = response || [];
    
    const totalBreaks = breaks.length;
    const completedBreaks = breaks.filter(b => b.completed).length;
    const quickBreaks = breaks.filter(b => b.break_type === 'quick').length;
    const stretchBreaks = breaks.filter(b => b.break_type === 'stretch').length;
    const walkBreaks = breaks.filter(b => b.break_type === 'walk').length;
    const complianceRate = totalBreaks > 0 
      ? Math.round((completedBreaks / totalBreaks) * 100) 
      : 0;
    
    return {
      totalBreaks,
      completedBreaks,
      quickBreaks,
      stretchBreaks,
      walkBreaks,
      complianceRate,
      breaks
    };
  } catch (error) {
    console.error('Failed to get break statistics:', error);
    return null;
  }
}

/**
 * Reset stress tracking
 */
export function resetStressTracking() {
  stressStartTime = null;
}

/**
 * Check if break is currently enforced
 */
export function isBreakEnforced() {
  return breakEnforced;
}

/**
 * Get recommended break type based on stress level
 */
export function getRecommendedBreakType(stressLevel) {
  if (stressLevel >= 90) {
    return 'walk';
  } else if (stressLevel >= 75) {
    return 'stretch';
  } else if (stressLevel >= 60) {
    return 'quick';
  }
  return 'quick';
}
