// Configuration constants for Guidance Guru extension

module.exports = {
  // Emotion Detection Settings
  EMOTION_CAPTURE_INTERVAL: 30000, // 30 seconds in milliseconds
  EMOTION_CONFIDENCE_THRESHOLD: 0.6,
  
  // Posture Detection Settings
  POSTURE_CHECK_INTERVAL: 200, // ~5 fps low power mode
  POSTURE_HIGH_FPS_INTERVAL: 33, // 30 fps
  HEAD_TILT_THRESHOLD: 30, // degrees
  SHOULDER_ASYMMETRY_THRESHOLD: 15, // pixels
  SPINE_DEVIATION_THRESHOLD: 20, // degrees
  
  // Posture Scoring Weights
  HEAD_TILT_WEIGHT: 2,
  SHOULDER_ASYMMETRY_WEIGHT: 1.5,
  SPINE_DEVIATION_WEIGHT: 1,
  
  // Break Enforcement Settings
  BREAK_TRIGGER_POSTURE_THRESHOLD: 60,
  BREAK_TRIGGER_STRESS_DURATION: 45 * 60 * 1000, // 45 minutes in milliseconds
  BREAK_CHECK_INTERVAL: 60000, // Check every minute
  
  // Break Types and Durations
  BREAK_TYPES: {
    QUICK: { duration: 2 * 60 * 1000, label: 'Quick Break (2 min)' },
    STRETCH: { duration: 3 * 60 * 1000, label: 'Stretch Guide (3 min)' },
    WALK: { duration: 5 * 60 * 1000, label: 'Walk Break (5 min)' }
  },
  
  // Stress Level Thresholds for Meditation
  STRESS_LEVELS: {
    LOW: { min: 0, max: 60, meditation: '2-min breathing' },
    MEDIUM: { min: 60, max: 75, meditation: '2-min breathing' },
    HIGH: { min: 75, max: 90, meditation: '5-min body scan' },
    CRITICAL: { min: 90, max: 100, meditation: '10-min guided meditation' }
  },
  
  // Data Retention
  DATA_RETENTION_DAYS: 90,
  
  // Storage Keys
  STORAGE_KEYS: {
    USER_SETTINGS: 'user_settings',
    EMOTION_SESSIONS: 'emotion_sessions',
    POSTURE_RECORDS: 'posture_records',
    WEBSITE_ACTIVITY: 'website_activity',
    BREAK_HISTORY: 'break_history',
    MEDITATION_LOGS: 'meditation_logs'
  },
  
  // Emotion Categories
  EMOTIONS: {
    POSITIVE: ['happy', 'calm'],
    NEUTRAL: ['neutral', 'focused', 'surprised'],
    NEGATIVE: ['stressed', 'angry', 'sad', 'fearful', 'disgusted']
  },
  
  // UI Colors (matching blue theme)
  COLORS: {
    PRIMARY_BLUE: '#2563eb',
    LIGHT_BLUE: '#dbeafe',
    ACCENT_BLUE: '#0ea5e9',
    STRESS_RED: '#dc2626',
    CALM_GREEN: '#10b981',
    NEUTRAL_GRAY: '#6b7280',
    BG_WHITE: '#ffffff'
  }
};
