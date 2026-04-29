// Notification Manager Module - Toast and modal handling

let notificationContainer = null;

/**
 * Initialize notification container
 */
export function initNotificationContainer() {
  if (notificationContainer) return;
  
  notificationContainer = document.createElement('div');
  notificationContainer.id = 'gg-notification-container';
  notificationContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 999999;
    display: flex;
    flex-direction: column;
    gap: 10px;
    pointer-events: none;
  `;
  
  document.body.appendChild(notificationContainer);
}

/**
 * Show a toast notification
 */
export function showToast(message, type = 'info', duration = 5000) {
  if (!notificationContainer) {
    initNotificationContainer();
  }
  
  const toast = document.createElement('div');
  toast.className = `gg-toast gg-toast-${type}`;
  
  const colors = {
    info: '#2563eb',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#dc2626'
  };
  
  const icons = {
    info: 'ℹ️',
    success: '✓',
    warning: '⚠️',
    error: '✕'
  };
  
  toast.style.cssText = `
    background: white;
    border-left: 4px solid ${colors[type] || colors.info};
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    min-width: 280px;
    max-width: 400px;
    display: flex;
    align-items: center;
    gap: 12px;
    pointer-events: auto;
    animation: slideIn 0.3s ease-out;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    color: #374151;
  `;
  
  toast.innerHTML = `
    <span style="font-size: 18px;">${icons[type] || icons.info}</span>
    <span>${message}</span>
  `;
  
  notificationContainer.appendChild(toast);
  
  // Auto-remove after duration
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
  
  return toast;
}

/**
 * Show posture correction alert
 */
export function showPostureAlert(postureScore, issues) {
  const messages = {
    head_forward_tilt: '📱 Head forward! Sit up straight.',
    shoulder_asymmetry: '⚖️ Uneven shoulders. Relax and align.',
    spine_deviation: '🔄 Spine misaligned. Center yourself.',
    hip_misalignment: '🪑 Check your seating position.'
  };
  
  let message = '⚠️ Posture Alert: ';
  if (issues && issues.length > 0) {
    message += issues.map(i => messages[i.type] || i.message).join(' ');
  } else {
    message += `Your posture score is ${postureScore}/100`;
  }
  
  return showToast(message, 'warning', 10000);
}

/**
 * Show stress alert banner
 */
export function showStressAlert(emotion, confidence) {
  if (!notificationContainer) {
    initNotificationContainer();
  }
  
  // Check if alert already exists
  const existingAlert = document.getElementById('gg-stress-alert');
  if (existingAlert) {
    existingAlert.remove();
  }
  
  const alert = document.createElement('div');
  alert.id = 'gg-stress-alert';
  alert.className = 'gg-stress-alert';
  
  alert.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
    color: white;
    padding: 12px 20px;
    text-align: center;
    z-index: 999998;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    animation: slideDown 0.3s ease-out;
  `;
  
  alert.innerHTML = `
    <span>😰</span>
    <span>High stress detected (${Math.round(confidence * 100)}%). Take a deep breath!</span>
    <button id="gg-stress-dismiss" style="
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      padding: 4px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    ">Dismiss</button>
  `;
  
  document.body.appendChild(alert);
  
  // Dismiss handler
  document.getElementById('gg-stress-dismiss').addEventListener('click', () => {
    alert.style.animation = 'slideUp 0.3s ease-out';
    setTimeout(() => alert.remove(), 300);
  });
  
  // Auto-dismiss after 30 seconds
  setTimeout(() => {
    if (alert.parentNode) {
      alert.style.animation = 'slideUp 0.3s ease-out';
      setTimeout(() => alert.remove(), 300);
    }
  }, 30000);
  
  return alert;
}

/**
 * Show break enforcement modal (non-dismissible)
 */
export function showBreakModal(breakData, onBreakSelected) {
  // Remove existing modal if any
  const existingModal = document.getElementById('gg-break-modal');
  if (existingModal) {
    existingModal.remove();
  }
  
  const overlay = document.createElement('div');
  overlay.id = 'gg-break-modal';
  overlay.className = 'gg-break-modal';
  
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.8);
    z-index: 1000000;
    display: flex;
    justify-content: center;
    align-items: center;
    animation: fadeIn 0.3s ease-out;
  `;
  
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: white;
    border-radius: 16px;
    padding: 32px;
    max-width: 500px;
    width: 90%;
    text-align: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    animation: scaleIn 0.3s ease-out;
  `;
  
  modal.innerHTML = `
    <h2 style="
      margin: 0 0 16px 0;
      color: #2563eb;
      font-size: 28px;
      font-weight: 600;
    ">🧘 Time for a Break!</h2>
    
    <p style="
      color: #6b7280;
      font-size: 16px;
      line-height: 1.5;
      margin-bottom: 24px;
    ">You've been stressed with poor posture for a while. It's time to take care of yourself.</p>
    
    <div style="
      background: #dbeafe;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 24px;
    ">
      <p style="margin: 0; color: #2563eb; font-weight: 500;">
        Recommended: ${breakData.label || 'Quick Break'}
      </p>
    </div>
    
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <button data-type="quick" style="
        background: #2563eb;
        color: white;
        border: none;
        padding: 14px 24px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;
      ">Quick Break (2 min)</button>
      
      <button data-type="stretch" style="
        background: #0ea5e9;
        color: white;
        border: none;
        padding: 14px 24px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;
      ">Stretch Guide (3 min)</button>
      
      <button data-type="walk" style="
        background: #10b981;
        color: white;
        border: none;
        padding: 14px 24px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;
      ">Walk Break (5 min)</button>
    </div>
    
    <p style="
      margin-top: 20px;
      color: #9ca3af;
      font-size: 12px;
    ">Please select a break option to continue</p>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Add button handlers
  const buttons = modal.querySelectorAll('button');
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const breakType = button.getAttribute('data-type');
      if (onBreakSelected) {
        onBreakSelected(breakType);
      }
    });
    
    // Hover effects
    button.addEventListener('mouseenter', () => {
      button.style.opacity = '0.9';
    });
    button.addEventListener('mouseleave', () => {
      button.style.opacity = '1';
    });
  });
  
  return overlay;
}

/**
 * Hide break modal
 */
export function hideBreakModal() {
  const modal = document.getElementById('gg-break-modal');
  if (modal) {
    modal.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => modal.remove(), 300);
  }
}

/**
 * Show meditation launch notification
 */
export function showMeditationLaunch(meditationType) {
  return showToast(`🧘 Launching ${meditationType} session...`, 'success', 3000);
}

/**
 * Clean up all notifications
 */
export function cleanupNotifications() {
  if (notificationContainer) {
    notificationContainer.innerHTML = '';
  }
  
  const alerts = document.querySelectorAll('.gg-stress-alert, .gg-break-modal');
  alerts.forEach(alert => alert.remove());
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
  @keyframes slideDown {
    from { transform: translateY(-100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes slideUp {
    from { transform: translateY(0); opacity: 1; }
    to { transform: translateY(-100%); opacity: 0; }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes scaleIn {
    from { transform: scale(0.9); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
`;
if (!document.getElementById('gg-animations')) {
  style.id = 'gg-animations';
  document.head.appendChild(style);
}
