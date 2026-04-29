# 🧘 Guidance Guru - Wellness & Mindfulness Platform

A premium dark-themed wellness website featuring emotion recognition, posture monitoring, meditation timer, breathing exercises, and comprehensive analytics.

## ✨ Features

### 1. Real-Time Emotion Detection
- AI-powered facial emotion recognition using face-api.js
- Detects: Happy, Sad, Angry, Fearful, Disgusted, Surprised, Neutral, Stressed
- Updates every 30 seconds with confidence scores
- Color-coded status indicators (Green/Yellow/Red)

### 2. Posture Monitoring
- Real-time posture scoring (0-100)
- Tracks: Head tilt, Shoulder balance, Spine alignment
- Automatic break recommendations for poor posture + stress
- Visual progress circle with color coding

### 3. Meditation Studio
- Customizable timer (5, 10, 15, 30 min or custom)
- Ambient sound selection: Forest, Rain, Ocean
- Circular progress indicator
- Start/Pause/Reset controls
- Session logging

### 4. Breathing Exercises
- 4 techniques: Box Breathing (4-4-4-4), 4-7-8 Relax, Stress Relief (4-6-8), Balance (5-5-5)
- Super smooth animations for Inhale/Hold/Exhale phases
- Animated breathing circle with glow effects
- Cycle counter and session timer
- Phase indicators

### 5. Break Enforcement System
- Full-screen modal overlay
- 3 break types: Quick (2min), Stretch (3min), Walk (5min)
- Countdown timer with progress bar
- Cannot dismiss until break completes
- Auto-triggered by poor posture + stress

### 6. Analytics Dashboard
- Daily Stress Index chart
- Posture trends (weekly)
- Emotion distribution (doughnut chart)
- Wellness insights
- Data export to CSV

## 🎨 Design Highlights

### Premium Dark Theme
- Deep blue color palette (#0a0e17, #0f1425, #161f3a)
- Blue accent colors (#3b82f6, #2563eb, #1d4ed8)
- Glass morphism effects with backdrop blur
- Glowing shadows and gradients

### Senior Designer Animations
- Smooth fade-in section transitions
- Pulsing glow effects on indicators
- Breathing circle animations (inhale/hold/exhale)
- Floating particle background
- Wave animations on audio selectors
- Hover lift effects on cards
- Shimmer text effects
- Logo pulse animation

## 🚀 Getting Started

### Option 1: Open Directly
Simply open `index.html` in your browser.

### Option 2: Use a Local Server
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve

# Then open http://localhost:8000
```

## 📁 File Structure

```
/workspace/
├── index.html          # Main HTML structure
├── styles.css          # Premium dark theme CSS
├── app.js              # Application logic
└── README.md           # This file
```

## 🛠️ Technologies Used

- **HTML5** - Semantic structure
- **CSS3** - Flexbox, Grid, Custom Properties, Animations
- **Vanilla JavaScript (ES6+)** - No frameworks, pure JS
- **face-api.js** - Emotion detection (TensorFlow.js based)
- **Chart.js** - Analytics visualizations
- **IndexedDB** - Local data storage

## 🎯 Usage Guide

### Emotion Detection
1. Click the camera icon on the Emotion card
2. Allow camera access when prompted
3. Wait for AI models to load (~10 seconds)
4. Your emotion will be detected every 30 seconds

### Meditation
1. Select duration (preset or custom)
2. Choose ambient sound
3. Click "Start Session"
4. Timer counts down with circular progress

### Breathing Exercise
1. Select technique from left panel
2. Click "Start Exercise"
3. Follow the animated circle:
   - Expands = Inhale
   - Glows = Hold
   - Contracts = Exhale
4. Complete cycles for best results

### Take a Break
- Click "Take a Break Now" button
- Or auto-triggered when stressed + poor posture
- Select break type
- Timer runs, cannot close early
- Logged to analytics

## 📊 Data Storage

All data is stored locally in IndexedDB:
- Emotion sessions
- Posture records
- Meditation sessions
- Break history

Data can be exported as CSV from the Analytics section.

## 🔒 Privacy

- 100% offline operation
- No data sent to external servers
- Camera access only when explicitly enabled
- All processing done locally in browser

## 🎨 Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Blue | #3b82f6 | Main accents, buttons |
| Secondary Blue | #2563eb | Links, highlights |
| Tertiary Blue | #1d4ed8 | Gradients |
| Success Green | #10b981 | Positive feedback |
| Warning Amber | #f59e0b | Caution states |
| Danger Red | #ef4444 | Stress alerts |
| Background | #0a0e17 | Main background |

## 🐛 Troubleshooting

### Camera not working
- Ensure you've granted camera permissions
- Check if another app is using the camera
- Try refreshing the page

### AI models not loading
- Check internet connection (models load from CDN)
- Wait ~10 seconds for initial load
- Check browser console for errors

### Charts not displaying
- Ensure Chart.js CDN is accessible
- Navigate to Analytics tab to trigger render

## 📝 Browser Support

- Chrome 90+
- Firefox 90+
- Safari 14+
- Edge 90+

## 🙏 Credits

Built following the plan.md specification for Guidance Guru wellness platform.

---

**Made with 💙 for mindfulness and productivity**
