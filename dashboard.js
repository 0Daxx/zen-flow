// Dashboard Script for Guidance Guru Extension

import { getTodaysOverview, getWeeklyTrends, getMostStressfulSites, generateWellnessInsights } from './modules/analytics.js';
import { STORES } from './storage/indexedDB.js';

// Chart instances
let hourlyStressChart = null;
let weeklyStressChart = null;
let weeklyPostureChart = null;
let websiteTimeChart = null;

// Emotion icons
const emotionIcons = {
  happy: '😊',
  calm: '😌',
  neutral: '😐',
  focused: '🎯',
  surprised: '😮',
  stressed: '😰',
  angry: '😠',
  sad: '😢',
  fearful: '😨',
  disgusted: '🤢'
};

// Initialize dashboard
async function initialize() {
  console.log('Dashboard initialized');
  
  // Set current date
  document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Setup navigation
  setupNavigation();
  
  // Load today's overview by default
  await loadTodaysOverview();
  
  // Setup event listeners
  setupEventListeners();
}

// Setup navigation between views
function setupNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn');
  
  navBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      // Update active button
      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update active view
      const views = document.querySelectorAll('.view');
      views.forEach(v => v.classList.remove('active'));
      
      const viewId = btn.getAttribute('data-view');
      document.getElementById(`view-${viewId}`).classList.add('active');
      
      // Load view-specific data
      switch (viewId) {
        case 'today':
          await loadTodaysOverview();
          break;
        case 'weekly':
          await loadWeeklyTrends();
          break;
        case 'sites':
          await loadSiteAnalytics();
          break;
        case 'insights':
          await loadWellnessInsights();
          break;
      }
    });
  });
}

// Load today's overview
async function loadTodaysOverview() {
  try {
    // Get today's data
    const overview = await getTodaysOverview();
    
    // Update metrics
    document.getElementById('today-stress-index').textContent = overview.stressIndex || '--';
    document.getElementById('today-posture-score').textContent = overview.postureScore || '--';
    document.getElementById('today-breaks').textContent = '--'; // Will be loaded separately
    document.getElementById('today-meditation').textContent = '--'; // Will be loaded separately
    
    // Load break count
    const breakResponse = await chrome.runtime.sendMessage({
      action: 'getRecords',
      storeName: STORES.BREAK_HISTORY,
      options: {}
    });
    
    const breaks = breakResponse?.data || [];
    const today = new Date().toISOString().split('T')[0];
    const todaysBreaks = breaks.filter(b => b.session_date === today).length;
    document.getElementById('today-breaks').textContent = todaysBreaks;
    
    // Load meditation count
    const meditationResponse = await chrome.runtime.sendMessage({
      action: 'getRecords',
      storeName: STORES.MEDITATION_LOGS,
      options: {}
    });
    
    const meditations = meditationResponse?.data || [];
    const todaysMeditations = meditations.filter(m => m.session_date === today).length;
    document.getElementById('today-meditation').textContent = todaysMeditations;
    
    // Load hourly stress chart
    await loadHourlyStressChart();
    
    // Get current emotion
    await loadCurrentEmotion();
    
  } catch (error) {
    console.error('Error loading today\'s overview:', error);
  }
}

// Load current emotion
async function loadCurrentEmotion() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getCurrentState' });
    
    if (response && response.emotion) {
      const emotion = response.emotion.emotion;
      const icon = emotionIcons[emotion] || '😐';
      
      document.querySelector('.emotion-icon-huge').textContent = icon;
      document.querySelector('.emotion-label').textContent = capitalizeFirst(emotion);
    }
  } catch (error) {
    console.log('Could not load current emotion:', error);
  }
}

// Load hourly stress chart
async function loadHourlyStressChart() {
  const ctx = document.getElementById('hourly-stress-chart').getContext('2d');
  
  // Prepare data
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  const stressCounts = new Array(24).fill(0);
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getRecords',
      storeName: STORES.EMOTION_SESSIONS,
      options: {}
    });
    
    const sessions = response?.data || [];
    const stressEmotions = ['stressed', 'angry', 'sad', 'fearful'];
    const today = new Date().toISOString().split('T')[0];
    
    for (const session of sessions) {
      if (session.session_date === today && stressEmotions.includes(session.emotion)) {
        const hour = new Date(session.timestamp).getHours();
        stressCounts[hour]++;
      }
    }
    
    // Destroy existing chart
    if (hourlyStressChart) {
      hourlyStressChart.destroy();
    }
    
    // Create new chart
    hourlyStressChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: hours,
        datasets: [{
          label: 'Stress Occurrences',
          data: stressCounts,
          backgroundColor: 'rgba(220, 38, 38, 0.7)',
          borderColor: 'rgba(220, 38, 38, 1)',
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Error loading hourly stress chart:', error);
  }
}

// Load weekly trends
async function loadWeeklyTrends() {
  try {
    const trends = await getWeeklyTrends();
    
    // Stress trend chart
    const stressCtx = document.getElementById('weekly-stress-chart').getContext('2d');
    
    if (weeklyStressChart) {
      weeklyStressChart.destroy();
    }
    
    weeklyStressChart = new Chart(stressCtx, {
      type: 'line',
      data: {
        labels: trends.stressTrend.map(d => d.day),
        datasets: [{
          label: 'Stress Index',
          data: trends.stressTrend.map(d => d.stressIndex),
          borderColor: '#dc2626',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });
    
    // Posture trend chart
    const postureCtx = document.getElementById('weekly-posture-chart').getContext('2d');
    
    if (weeklyPostureChart) {
      weeklyPostureChart.destroy();
    }
    
    weeklyPostureChart = new Chart(postureCtx, {
      type: 'line',
      data: {
        labels: trends.postureTrend.map(d => d.day),
        datasets: [{
          label: 'Posture Score',
          data: trends.postureTrend.map(d => d.score),
          borderColor: '#0ea5e9',
          backgroundColor: 'rgba(14, 165, 233, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });
    
    // Website time chart
    await loadWebsiteTimeChart();
    
  } catch (error) {
    console.error('Error loading weekly trends:', error);
  }
}

// Load website time chart
async function loadWebsiteTimeChart() {
  const ctx = document.getElementById('website-time-chart').getContext('2d');
  
  try {
    const sites = await getMostStressfulSites(7);
    
    if (websiteTimeChart) {
      websiteTimeChart.destroy();
    }
    
    websiteTimeChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sites.slice(0, 10).map(s => s.domain.length > 15 ? s.domain.substring(0, 15) + '...' : s.domain),
        datasets: [{
          label: 'Time Spent (hours)',
          data: sites.slice(0, 10).map(s => Math.round(s.totalTimeSeconds / 3600 * 10) / 10),
          backgroundColor: 'rgba(37, 99, 235, 0.7)',
          borderColor: 'rgba(37, 99, 235, 1)',
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        indexAxis: 'y',
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            beginAtZero: true
          }
        }
      }
    });
  } catch (error) {
    console.error('Error loading website time chart:', error);
  }
}

// Load site analytics
async function loadSiteAnalytics() {
  try {
    const sites = await getMostStressfulSites(7);
    const tbody = document.getElementById('sites-table-body');
    
    tbody.innerHTML = '';
    
    for (const site of sites) {
      const tr = document.createElement('tr');
      
      const stressClass = site.stressIndex >= 70 ? 'high' : site.stressIndex >= 40 ? 'medium' : 'low';
      
      tr.innerHTML = `
        <td>${site.domain}</td>
        <td>${site.totalTimeFormatted}</td>
        <td><span class="stress-badge ${stressClass}">${site.stressIndex}%</span></td>
        <td>${site.breaksTaken}</td>
        <td>${site.totalSessions}</td>
      `;
      
      tbody.appendChild(tr);
    }
    
    if (sites.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #6b7280;">No data available</td></tr>';
    }
  } catch (error) {
    console.error('Error loading site analytics:', error);
  }
}

// Load wellness insights
async function loadWellnessInsights() {
  try {
    const insights = await generateWellnessInsights();
    const container = document.getElementById('insights-container');
    
    container.innerHTML = '';
    
    const insightTypes = {
      pattern: '📊 Pattern Detected',
      warning: '⚠️ Attention Needed',
      positive: '✅ Great Job!',
      tip: '💡 Tip',
      encouragement: '🌟 Keep Going',
      'site-warning': '🌐 Site Alert'
    };
    
    for (const insight of insights) {
      const card = document.createElement('div');
      card.className = `insight-card ${insight.type}`;
      
      card.innerHTML = `
        <div class="insight-header">
          <span class="insight-type">${insightTypes[insight.type] || '💬 Insight'}</span>
        </div>
        <p class="insight-message">${insight.message}</p>
      `;
      
      container.appendChild(card);
    }
    
    if (insights.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: #6b7280;">Keep using the extension to receive personalized insights!</p>';
    }
  } catch (error) {
    console.error('Error loading wellness insights:', error);
  }
}

// Setup event listeners
function setupEventListeners() {
  // Export data button
  document.getElementById('export-data-btn').addEventListener('click', exportData);
  
  // Back to popup button
  document.getElementById('back-to-popup').addEventListener('click', () => {
    window.close();
  });
}

// Export data as CSV
async function exportData() {
  try {
    let csvContent = 'Date,Type,Value,Details\n';
    
    // Export emotion sessions
    const emotions = await chrome.runtime.sendMessage({
      action: 'getRecords',
      storeName: STORES.EMOTION_SESSIONS,
      options: {}
    });
    
    for (const e of (emotions?.data || [])) {
      csvContent += `${e.session_date},Emotion,${e.emotion},${e.confidence}\n`;
    }
    
    // Export posture records
    const postures = await chrome.runtime.sendMessage({
      action: 'getRecords',
      storeName: STORES.POSTURE_RECORDS,
      options: {}
    });
    
    for (const p of (postures?.data || [])) {
      csvContent += `${p.session_date},Posture,${p.score},\n`;
    }
    
    // Export breaks
    const breaks = await chrome.runtime.sendMessage({
      action: 'getRecords',
      storeName: STORES.BREAK_HISTORY,
      options: {}
    });
    
    for (const b of (breaks?.data || [])) {
      csvContent += `${b.session_date},Break,${b.break_type},${b.completed ? 'Completed' : 'Cancelled'}\n`;
    }
    
    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guidance-guru-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert('Data exported successfully!');
  } catch (error) {
    console.error('Error exporting data:', error);
    alert('Failed to export data. Please try again.');
  }
}

// Utility: Capitalize first letter
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Initialize on load
initialize();
