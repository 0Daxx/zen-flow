context for a Chrome extension that complements your meditation app. Let me structure this as a senior developer would.

---

## Project Overview

**Guidance Guru** is a **productivity wellness Chrome extension** that combines real-time emotion recognition, posture monitoring, and website activity tracking to encourage mindful breaks and stress management throughout the work day. It operates **100% offline** with local browser-based emotion detection and integrates with your meditation app for guided sessions.

---

## Core Architecture & Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend UI** | HTML5 + CSS3 (Flexbox/Grid) | Dashboard, settings, progress views |
| **Interaction Logic** | Vanilla JavaScript (ES6+) | Event handling, state management, user interactions |
| **Emotion Detection** | TensorFlow.js + face-api.js | Local, offline facial emotion recognition |
| **Posture Detection** | TensorFlow.js + PoseNet | Real-time skeletal keypoint analysis |
| **Storage** | Chrome Storage API + IndexedDB | Session data, user settings, historical analytics |
| **Background Tasks** | Chrome Service Worker | Periodic snapshots, break enforcement, site tracking |
| **Communication** | Chrome Message Passing API | Extension ↔ Content Script ↔ Background Worker |
| **Theming** | CSS Variables + Blue Color Palette | Consistent blue meditation-inspired UI |

---

## Detailed Feature Specifications

### 1. Emotion Recognition Engine

**Objective:** Detect user emotional state every 30 seconds via webcam (with permission).

#### Technical Implementation
- **Library:** face-api.js (built on TensorFlow.js) for lightweight facial emotion detection
- **Emotions Detected:** Happy, Sad, Angry, Fearful, Disgusted, Surprised, Neutral, Stressed
- **Capture Method:**
  - Runs in **background service worker** with minimal performance overhead
  - Captures frame from `getUserMedia()` API every 30 seconds
  - Processes locally in browser; **no data sent externally**
  - Stores emotion state with timestamp in IndexedDB

#### Data Structure (IndexedDB Schema)
```javascript
{
  id: "emotion_session_20260429_153045",
  timestamp: 1704067845000,
  emotion: "stressed",
  confidence: 0.92,
  posture_score: 78,
  website_active: "github.com",
  session_date: "2026-04-29"
}
```

#### UI Component: Emotion Status Widget
- **Location:** Extension popup & overlay badge
- **Display:** Real-time emotion icon + confidence percentage
- **Color Coding:** 
  - 🟢 Green (Calm/Happy) → No action
  - 🟡 Yellow (Neutral/Focused) → Monitor
  - 🔴 Red (Stressed/Angry) → Trigger break recommendation

---

### 2. Posture Correction System

**Objective:** Monitor sitting posture in real-time and alert user to poor positioning.

#### Technical Implementation
- **Library:** PoseNet (TensorFlow.js) for 17-point skeletal keypoint detection
- **Monitored Keypoints:** Head, shoulders, spine, hips
- **Detection Frequency:** Continuous (30 fps) or adaptive (5 fps for low-power mode)
- **Poor Posture Indicators:**
  - Head tilt > 30° forward (text neck)
  - Shoulder asymmetry > 15 pixels
  - Spine curvature deviation > 20°
  - Hip-seat misalignment

#### Posture Scoring Algorithm
```javascript
// Pseudo-code
function calculatePostureScore() {
  let score = 100;
  score -= headForwardTilt * 2;        // -0 to -60 points
  score -= shoulderAsymmetry * 1.5;    // -0 to -22.5 points
  score -= spineDeviation * 1;         // -0 to -20 points
  return Math.max(0, score);           // Range: 0-100
}
```

#### Break Trigger Logic
- **Threshold:** If posture score < 60 AND emotion = "stressed" for > 45 minutes
- **Action:** Show full-screen break notification with meditation app integration
- **User Cannot Dismiss:** Must wait 5 minutes or complete guided 2-minute breathing exercise

---

### 3. Break Enforcement System

**Objective:** Force intentional breaks before user returns to work.

#### Break Workflow
1. **Detection:** Poor posture + elevated stress + long session time
2. **Notification:** Full-screen modal overlay (cannot be dismissed)
3. **Options:**
   - ✅ **Quick Break (2 min):** Launches your meditation app's breathing guide
   - ✅ **Stretch Guide (3 min):** Animated posture correction exercises
   - ✅ **Walk Break (5 min):** Timer with encouraging message; pauses work tracking
4. **Resume:** Only after time elapsed or exercise completed
5. **Tracking:** Log break duration + type in analytics

---

### 4. Website & Activity Tracking

**Objective:** Monitor which sites consume work time and correlate with stress levels.

#### Technical Implementation
- **Method:** Chrome Content Script monitors active tab via `chrome.tabs.onActivated` API
- **Data Captured (per 30-second interval):**
  - Domain name (extracted from URL)
  - Time spent (in seconds)
  - Associated emotion & posture score
  - Break frequency on that site

#### Storage
```javascript
{
  website_domain: "github.com",
  date: "2026-04-29",
  total_time_seconds: 7200,
  sessions: [
    { start: 153000, end: 153045, emotion: "focused", posture: 85 },
    { start: 153045, end: 153090, emotion: "stressed", posture: 62 }
  ],
  stress_index: 0.65,
  breaks_taken: 3
}
```

#### Privacy
- **No personal data sent:** Domains stored locally only
- **User controls:** Can exclude sites from tracking (whitelist/blacklist)
- **Automatic purge:** Data older than 90 days auto-deleted

---

### 5. Progress Tracking & Analytics Dashboard

**Objective:** Visualize stress patterns, identify high-risk activities, and plan better work schedules.

#### Key Metrics Displayed
| Metric | Purpose | Calculation |
|--------|---------|-------------|
| **Daily Stress Index** | Overall stress level 0-100 | Average of all emotion confidence scores for "stressed/angry" |
| **Peak Stress Times** | When user is most stressed | Hour-by-hour aggregation + heatmap visualization |
| **Relaxation Windows** | When user is calmest | Filter emotions: happy, calm, neutral |
| **Posture Hygiene Score** | Weekly posture average | Mean of all posture_score entries |
| **Most Stressful Sites** | Which domains trigger stress | Correlation: site_domain + stress_index > 0.7 |
| **Break Compliance** | % of recommended breaks taken | (breaks_taken / breaks_recommended) × 100 |

#### Dashboard Views
1. **Today's Overview** (default)
   - Real-time emotion gauge
   - Current posture score
   - Time on active website
   - Suggested break button

2. **Weekly Trends** (7-day line chart)
   - Stress index progression
   - Posture score trend
   - Website time distribution (stacked bar chart)

3. **Site Analytics** (ranked list)
   - Top 10 domains by time spent
   - Stress index per domain (color-coded)
   - Recommended break frequency per site

4. **Wellness Insights** (personalized)
   - "You're most stressed on Mondays at 11 AM"
   - "Meditation apps reduce your stress by 35% on average"
   - "Your best posture day: Thursday (85/100)"

---

### 6. Integration with Meditation App

**Objective:** Seamlessly launch your existing meditation app during breaks.

#### Implementation
- **Method:** Chrome extension messaging API
- **Trigger:** When break is enforced, extension opens your app in new tab/window
- **Guided Session:** Recommend specific duration based on stress level
  - Stress 60-75 → 2-min breathing
  - Stress 75-90 → 5-min body scan
  - Stress 90+ → 10-min guided meditation

#### Data Sync
- **After Meditation:** App reports completion back to extension via message passing
- **Log Entry:** Extension records meditation session in analytics
- **Reinforcement:** Show user "You meditated 4 times this week!" motivational message

---

## UI/UX Specifications

### Color Palette (Blue Theme)
```css
:root {
  --primary-blue: #2563eb;         /* Deep meditation blue */
  --light-blue: #dbeafe;           /* Light UI backgrounds */
  --accent-blue: #0ea5e9;          /* Interactive elements */
  --stress-red: #dc2626;            /* Stress warnings */
  --calm-green: #10b981;           /* Positive feedback */
  --neutral-gray: #6b7280;         /* Secondary text */
  --bg-white: #ffffff;             /* Main background */
  --shadow: 0 4px 6px rgba(37, 99, 235, 0.1); /* Blue-tinted shadow */
}
```

### Key UI Components
1. **Popup Dashboard** (340px × 600px)
   - Collapsible emotion widget
   - Quick action buttons (Break Now, Open Meditation App)
   - Today's stress summary
   - Settings gear icon

2. **Overlay Notifications**
   - Break enforcement modal (cannot close)
   - Posture correction toast (bottom-right, auto-dismiss after 10 sec)
   - Stress alert banner (top, sticky)

3. **Full-Page Dashboard** (open as website)
   - Responsive grid layout
   - Charts: Chart.js or D3.js for visualizations
   - Data export button (CSV)

---

## Data Flow Diagram

```
┌─────────────────┐
│  Webcam Input   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Background Service Worker       │
│ - Emotion Detection (30s)       │
│ - Posture Detection (continuous)│
└────────┬────────────────────────┘
         │
         ▼
┌──────────────────────────┐
│ IndexedDB (Local)        │
│ - Emotion Sessions       │
│ - Posture Records        │
│ - Website Activity       │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Content Scripts (Per Tab)        │
│ - Monitor active domain          │
│ - Display overlay notifications  │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ Extension Popup / Dashboard  │
│ - Display analytics          │
│ - Trigger meditations        │
│ - Break enforcement UI       │
└──────────────────────────────┘
```

---

## Detailed File Structure (Recommended)

```
guidance-guru-extension/
├── manifest.json                 # Chrome extension config
├── popup.html                    # Extension popup UI
├── popup.css                     # Popup styling (blue theme)
├── popup.js                      # Popup interactions
│
├── dashboard.html                # Full-page analytics dashboard
├── dashboard.css                 # Dashboard styling
├── dashboard.js                  # Analytics rendering & charts
│
├── background.js                 # Service worker
│   ├── emotionDetection()        # Face-api.js integration
│   ├── postureDetection()        # PoseNet integration
│   ├── captureFrame()            # getUserMedia wrapper
│   └── storeAnalytics()          # IndexedDB writes
│
├── content.js                    # Content script (runs in page)
│   ├── trackActiveDomain()       # Monitor tab URL
│   ├── showBreakNotification()   # Break enforcement UI
│   └── overlayManager.js         # Overlay DOM manipulation
│
├── storage/
│   ├── indexedDB.js              # Database schema & queries
│   └── chromeStorage.js          # User preferences
│
├── modules/
│   ├── emotionDetector.js        # Emotion recognition wrapper
│   ├── postureDetector.js        # Posture recognition wrapper
│   ├── breakManager.js           # Break logic & enforcement
│   ├── analytics.js              # Data aggregation & insights
│   ├── meditationIntegration.js  # App communication
│   └── notificationManager.js    # Toast & modal handling
│
├── ui/
│   ├── components.css            # Reusable component styles
│   ├── breakModal.js             # Break notification component
│   ├── emotionWidget.js          # Real-time emotion display
│   └── charts.js                 # Chart.js initializations
│
├── assets/
│   ├── icons/                    # Emotion emotion icons (SVG)
│   │   ├── emotion-happy.svg
│   │   ├── emotion-stressed.svg
│   │   └── ...
│   └── models/                   # Pre-trained ML models
│       ├── face-api.models/      # Face detection models
│       └── posenet-model/        # PoseNet model weights
│
└── config/
    └── constants.js              # Magic numbers, thresholds
```

---

## Implementation Phases

### **Phase 1: Core Foundation** (Weeks 1-2)
- Manifest.json setup
- Basic popup UI with blue theme
- IndexedDB schema & initialization
- Chrome Storage API for user preferences

### **Phase 2: Emotion Detection** (Weeks 3-4)
- Integrate face-api.js
- Implement 30-second capture loop in service worker
- Build emotion widget UI
- Store emotion records

### **Phase 3: Posture Detection** (Weeks 5-6)
- Integrate PoseNet
- Develop posture scoring algorithm
- Posture correction alerts (non-blocking)
- Posture score recording

### **Phase 4: Website Tracking & Break Enforcement** (Weeks 7-8)
- Content script for domain monitoring
- Break trigger logic
- Full-screen break modal (non-dismissible)
- Break compliance tracking

### **Phase 5: Analytics Dashboard** (Weeks 9-10)
- Full-page dashboard HTML/CSS
- Chart.js integration for visualizations
- Data aggregation queries
- Wellness insights generation

### **Phase 6: Meditation Integration & Polish** (Weeks 11-12)
- Message passing to meditation app
- UI refinement & responsiveness
- Performance optimization
- User testing & bug fixes

---

## Critical Implementation Notes

### Permissions Required (manifest.json)
```json
{
  "permissions": [
    "activeTab",
    "scripting",
    "storage",
    "tabs",
    "identity",
    "webRequest",
    "contextMenus"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "optional_permissions": [
    "camera"
  ]
}
```

### Privacy & Security
- ✅ **Zero external calls:** All ML models run locally
- ✅ **Offline-first:** Works without internet
- ✅ **User consent:** Explicit camera permission prompt
- ✅ **Data isolation:** IndexedDB scoped to extension
- ✅ **No tracking:** No user data leaves the browser

### Performance Considerations
- Emotion capture every 30 seconds (not continuous) to reduce CPU
- PoseNet runs at adaptive frame rate (5-30 fps based on device)
- Service worker sleeps when extension popup is closed
- IndexedDB queries limited to 7-day rolling window for dashboard

---

## Next Steps for Development

1. **Create GitHub repo** with this specification as README
2. **Set up local development environment** with manifest.json v3
3. **Download pre-trained models** for face-api.js and PoseNet
4. **Build popup.html first** (easiest, highest visual feedback)
5. **Implement background.js** second (core functionality)
6. **Test with real webcam** before moving to content scripts
7. **Create sample data** for dashboard testing before live emotion detection

Would you like me to dive deeper into any specific module (e.g., posture scoring algorithm, IndexedDB schema, or dashboard chart design), or would you like starter code for any of these components?