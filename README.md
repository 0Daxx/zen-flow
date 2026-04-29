# Guidance Guru - Productivity Wellness Chrome Extension

A comprehensive Chrome extension that monitors your emotional state, posture, and website usage to promote workplace wellness through mindful breaks and meditation integration.

## Features

### 🎭 Real-time Emotion Recognition
- Uses face-api.js for facial expression analysis
- Detects 8 emotion categories: happy, calm, neutral, focused, surprised, stressed, angry, sad, fearful, disgusted
- Tracks stress levels throughout the day
- Provides visual feedback via popup widget

### 🧍 Posture Monitoring
- Uses PoseNet for body pose estimation
- Detects common posture issues:
  - Head forward tilt (text neck)
  - Shoulder asymmetry
  - Spine deviation
  - Hip misalignment
- Calculates posture score (0-100)
- Sends alerts for poor posture

### ⏸️ Break Enforcement
- Automatically triggers break modal when:
  - Extended stress (>45 minutes) detected
  - Poor posture combined with stress
- Three break types:
  - Quick Break (2 min)
  - Stretch Guide (3 min)
  - Walk Break (5 min)
- Non-dismissible until break is selected
- Visual timer during break

### 🧘 Meditation App Integration
- Launches external meditation app based on stress level
- Recommended sessions:
  - 2-min breathing (low stress)
  - 5-min body scan (medium stress)
  - 10-min guided meditation (high stress)
- Logs meditation sessions
- Tracks stress reduction effectiveness

### 📊 Analytics Dashboard
- Today's overview with key metrics
- Weekly trends for stress and posture
- Site analytics showing time spent and stress by domain
- Personalized wellness insights
- Data export to CSV

### 🌐 Website Tracking
- Tracks time spent on each website
- Correlates website usage with stress levels
- Identifies most stressful websites
- Option to exclude sites from tracking

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the extension folder
6. Grant camera permissions when prompted

## Project Structure

```
guidance-guru/
├── manifest.json          # Extension configuration
├── background.js          # Service worker
├── content.js             # Content script
├── popup.html             # Popup UI
├── popup.css              # Popup styles
├── popup.js               # Popup logic
├── dashboard.html         # Full dashboard page
├── dashboard.css          # Dashboard styles
├── dashboard.js           # Dashboard logic
├── config/
│   └── constants.js       # Configuration constants
├── storage/
│   ├── indexedDB.js       # IndexedDB wrapper
│   └── chromeStorage.js   # Chrome Storage API wrapper
├── modules/
│   ├── emotionDetector.js     # Face-api.js integration
│   ├── postureDetector.js     # PoseNet integration
│   ├── breakManager.js        # Break enforcement logic
│   ├── analytics.js           # Data aggregation
│   ├── meditationIntegration.js # Meditation app integration
│   └── notificationManager.js # Toast/modal notifications
└── assets/
    ├── icons/             # Extension icons
    └── models/            # ML models (face-api, posenet)
```

## Usage

### First Time Setup
1. Install the extension
2. Click the extension icon to open popup
3. Grant camera permissions
4. Configure settings (meditation app URL, etc.)

### Daily Use
- The extension runs automatically in the background
- View current emotion and posture in the popup
- Receive break notifications when needed
- Access full dashboard for detailed analytics

### Context Menu Actions
- Right-click on any page for quick actions:
  - Take a Quick Break
  - Start Meditation
  - Exclude this site from tracking

## Privacy & Security

- All data stored locally (IndexedDB + Chrome Storage)
- No data sent to external servers
- Camera access only used for local processing
- 90-day data retention (configurable)
- Option to exclude specific websites

## Dependencies

The extension uses these external libraries (should be included in assets/models/):
- [face-api.js](https://github.com/justadudewhohacks/face-api.js) - Emotion detection
- [PoseNet](https://github.com/tensorflow/tfjs-models/tree/master/posenet) - Posture detection
- [Chart.js](https://www.chartjs.org/) - Dashboard charts (loaded via CDN)

## Configuration

Edit `config/constants.js` to customize:
- Detection intervals
- Threshold values
- Break durations
- Stress level mappings
- Color schemes

## Troubleshooting

### Camera not working
- Ensure camera permissions are granted
- Check if another app is using the camera
- Restart Chrome

### Models not loading
- Verify model files exist in `assets/models/`
- Check console for specific error messages

### High CPU usage
- Switch to low-power posture mode in settings
- Increase detection intervals in config

## License

MIT License - See LICENSE file for details

## Contributing

Contributions welcome! Please read CONTRIBUTING.md first.

## Support

For issues and feature requests, please use GitHub Issues.
