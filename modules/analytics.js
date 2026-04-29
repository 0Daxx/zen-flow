// Analytics Module - Data aggregation and insights generation

import { STORES } from '../storage/indexedDB.js';

/**
 * Calculate daily stress index
 */
export async function calculateDailyStressIndex(date = null) {
  try {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const response = await chrome.runtime.sendMessage({
      action: 'getRecords',
      storeName: STORES.EMOTION_SESSIONS,
      options: {}
    });
    
    const sessions = (response || []).filter(s => s.session_date === targetDate);
    
    if (sessions.length === 0) {
      return { stressIndex: 0, sessionCount: 0 };
    }
    
    const stressEmotions = ['stressed', 'angry', 'sad', 'fearful'];
    let totalStressScore = 0;
    
    for (const session of sessions) {
      if (stressEmotions.includes(session.emotion)) {
        totalStressScore += session.confidence || 0;
      }
    }
    
    const stressIndex = Math.round((totalStressScore / sessions.length) * 100);
    
    return {
      stressIndex: Math.min(100, stressIndex),
      sessionCount: sessions.length,
      date: targetDate
    };
  } catch (error) {
    console.error('Failed to calculate daily stress index:', error);
    return { stressIndex: 0, sessionCount: 0 };
  }
}

/**
 * Get peak stress times by hour
 */
export async function getPeakStressTimes(days = 7) {
  try {
    const startDate = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    const response = await chrome.runtime.sendMessage({
      action: 'getRecords',
      storeName: STORES.EMOTION_SESSIONS,
      options: { startDate }
    });
    
    const sessions = response || [];
    const stressEmotions = ['stressed', 'angry', 'sad', 'fearful'];
    
    // Aggregate by hour
    const hourlyData = {};
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = { count: 0, totalStress: 0 };
    }
    
    for (const session of sessions) {
      if (stressEmotions.includes(session.emotion)) {
        const hour = new Date(session.timestamp).getHours();
        hourlyData[hour].count++;
        hourlyData[hour].totalStress += session.confidence || 0;
      }
    }
    
    // Calculate average stress per hour
    const result = [];
    for (const [hour, data] of Object.entries(hourlyData)) {
      result.push({
        hour: parseInt(hour),
        stressCount: data.count,
        avgStress: data.count > 0 ? data.totalStress / data.count : 0
      });
    }
    
    // Sort by stress count
    result.sort((a, b) => b.stressCount - a.stressCount);
    
    return result;
  } catch (error) {
    console.error('Failed to get peak stress times:', error);
    return [];
  }
}

/**
 * Get relaxation windows (calm periods)
 */
export async function getRelaxationWindows(days = 7) {
  try {
    const startDate = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    const response = await chrome.runtime.sendMessage({
      action: 'getRecords',
      storeName: STORES.EMOTION_SESSIONS,
      options: { startDate }
    });
    
    const sessions = response || [];
    const calmEmotions = ['happy', 'calm', 'neutral'];
    
    const hourlyData = {};
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = { count: 0 };
    }
    
    for (const session of sessions) {
      if (calmEmotions.includes(session.emotion)) {
        const hour = new Date(session.timestamp).getHours();
        hourlyData[hour].count++;
      }
    }
    
    const result = [];
    for (const [hour, data] of Object.entries(hourlyData)) {
      result.push({
        hour: parseInt(hour),
        calmCount: data.count
      });
    }
    
    result.sort((a, b) => b.calmCount - a.calmCount);
    
    return result.slice(0, 5); // Top 5 calm hours
  } catch (error) {
    console.error('Failed to get relaxation windows:', error);
    return [];
  }
}

/**
 * Calculate weekly posture hygiene score
 */
export async function getPostureHygieneScore(days = 7) {
  try {
    const startDate = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    const response = await chrome.runtime.sendMessage({
      action: 'getRecords',
      storeName: STORES.POSTURE_RECORDS,
      options: { startDate }
    });
    
    const records = response || [];
    
    if (records.length === 0) {
      return { averageScore: 0, recordCount: 0 };
    }
    
    const totalScore = records.reduce((sum, r) => sum + (r.score || 0), 0);
    const averageScore = Math.round(totalScore / records.length);
    
    return {
      averageScore,
      recordCount: records.length,
      days
    };
  } catch (error) {
    console.error('Failed to calculate posture hygiene score:', error);
    return { averageScore: 0, recordCount: 0 };
  }
}

/**
 * Get most stressful websites
 */
export async function getMostStressfulSites(days = 7) {
  try {
    const startDate = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    const response = await chrome.runtime.sendMessage({
      action: 'getRecords',
      storeName: STORES.WEBSITE_ACTIVITY,
      options: { startDate }
    });
    
    const activities = response || [];
    const stressEmotions = ['stressed', 'angry', 'sad', 'fearful'];
    
    // Aggregate by domain
    const domainData = {};
    
    for (const activity of activities) {
      const domain = activity.website_domain;
      if (!domain) continue;
      
      if (!domainData[domain]) {
        domainData[domain] = {
          totalTime: 0,
          stressSessions: 0,
          totalSessions: 0,
          breaksTaken: 0
        };
      }
      
      domainData[domain].totalTime += activity.total_time_seconds || 0;
      domainData[domain].totalSessions += (activity.sessions || []).length;
      domainData[domain].breaksTaken += activity.breaks_taken || 0;
      
      for (const session of (activity.sessions || [])) {
        if (stressEmotions.includes(session.emotion)) {
          domainData[domain].stressSessions++;
        }
      }
    }
    
    // Calculate stress index per domain
    const result = [];
    for (const [domain, data] of Object.entries(domainData)) {
      const stressIndex = data.totalSessions > 0
        ? Math.round((data.stressSessions / data.totalSessions) * 100)
        : 0;
      
      result.push({
        domain,
        totalTimeSeconds: data.totalTime,
        totalTimeFormatted: formatTime(data.totalTime),
        stressSessions: data.stressSessions,
        totalSessions: data.totalSessions,
        stressIndex,
        breaksTaken: data.breaksTaken
      });
    }
    
    // Sort by stress index (descending)
    result.sort((a, b) => b.stressIndex - a.stressIndex);
    
    return result.slice(0, 10); // Top 10
  } catch (error) {
    console.error('Failed to get most stressful sites:', error);
    return [];
  }
}

/**
 * Get break compliance rate
 */
export async function getBreakCompliance(days = 7) {
  try {
    const startDate = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    const response = await chrome.runtime.sendMessage({
      action: 'getRecords',
      storeName: STORES.BREAK_HISTORY,
      options: { startDate }
    });
    
    const breaks = response || [];
    
    const totalBreaks = breaks.length;
    const completedBreaks = breaks.filter(b => b.completed && !b.cancelled).length;
    const complianceRate = totalBreaks > 0
      ? Math.round((completedBreaks / totalBreaks) * 100)
      : 0;
    
    return {
      totalBreaks,
      completedBreaks,
      complianceRate,
      days
    };
  } catch (error) {
    console.error('Failed to get break compliance:', error);
    return { totalBreaks: 0, completedBreaks: 0, complianceRate: 0 };
  }
}

/**
 * Generate wellness insights
 */
export async function generateWellnessInsights() {
  const insights = [];
  
  // Get peak stress times
  const peakStress = await getPeakStressTimes(7);
  if (peakStress.length > 0 && peakStress[0].stressCount > 3) {
    const hour = peakStress[0].hour;
    const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    insights.push({
      type: 'pattern',
      message: `You're most stressed on ${timeOfDay}s around ${hour}:00`,
      priority: 'high'
    });
  }
  
  // Get posture score
  const postureScore = await getPostureHygieneScore(7);
  if (postureScore.averageScore > 0) {
    if (postureScore.averageScore >= 80) {
      insights.push({
        type: 'positive',
        message: `Great posture! Your average score this week: ${postureScore.averageScore}/100`,
        priority: 'low'
      });
    } else if (postureScore.averageScore < 60) {
      insights.push({
        type: 'warning',
        message: `Your posture needs attention. Average score: ${postureScore.averageScore}/100`,
        priority: 'high'
      });
    }
  }
  
  // Get stressful sites
  const stressfulSites = await getMostStressfulSites(7);
  if (stressfulSites.length > 0 && stressfulSites[0].stressIndex > 70) {
    insights.push({
      type: 'site-warning',
      message: `${stressfulSites[0].domain} triggers the most stress (${stressfulSites[0].stressIndex}%)`,
      priority: 'medium'
    });
  }
  
  // Get break compliance
  const breakCompliance = await getBreakCompliance(7);
  if (breakCompliance.totalBreaks > 0 && breakCompliance.complianceRate < 50) {
    insights.push({
      type: 'encouragement',
      message: 'Try to complete more breaks when they are recommended',
      priority: 'medium'
    });
  }
  
  // Meditation effectiveness (placeholder - would need meditation logs)
  insights.push({
    type: 'tip',
    message: 'Regular meditation can reduce stress by up to 35%',
    priority: 'low'
  });
  
  return insights.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Format time in seconds to human readable
 */
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Get today's overview data
 */
export async function getTodaysOverview() {
  const stressIndex = await calculateDailyStressIndex();
  const postureScore = await getPostureHygieneScore(1);
  
  return {
    date: new Date().toISOString().split('T')[0],
    stressIndex: stressIndex.stressIndex,
    postureScore: postureScore.averageScore,
    emotionSessions: stressIndex.sessionCount,
    postureRecords: postureScore.recordCount
  };
}

/**
 * Get weekly trends data
 */
export async function getWeeklyTrends() {
  const stressData = [];
  const postureData = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const stress = await calculateDailyStressIndex(dateStr);
    const posture = await getPostureHygieneScore(1);
    
    stressData.push({
      date: dateStr,
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      stressIndex: stress.stressIndex
    });
    
    postureData.push({
      date: dateStr,
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      score: posture.averageScore
    });
  }
  
  return {
    stressTrend: stressData,
    postureTrend: postureData
  };
}
