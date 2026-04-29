# Guidance Guru - Installation & Demo Guide

## Quick Start (Version 0.0.1)

### Installation Steps

1. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)

2. **Load the Extension**
   - Click "Load unpacked"
   - Select the `/workspace` folder
   - Extension icon should appear in toolbar

3. **Grant Permissions**
   - Click extension icon
   - When prompted, allow camera access for emotion detection
   - Extension is now active!

### Testing the Demo

#### Test Break Page
1. Click extension icon in toolbar
2. Click "Take a Break" button
3. Full break page opens in new tab with:
   - Current stress/posture stats
   - Three break options (Meditation, Stretch, Walk)
   - Animated breathing guide
   - Timer with progress bar

#### Test Meditation Launch
1. Click extension icon
2. Click "Meditate" button
3. Break page opens with meditation mode

#### Test Context Menu
1. Right-click on any webpage
2. Select "Take a Quick Break" or "Start Meditation"
3. Break page opens

### Key Files Created

- `break.html` - Full-page break/meditation interface
- `background.js` - Service worker with break page opener
- `popup.js` - Updated to open break page
- `manifest.json` - Version 0.0.1, no optional_permissions

### What Works Now

✅ Extension loads without errors
✅ Valid PNG icons (16x16, 48x48, 128x128)
✅ No camera permission error in manifest
✅ Break page opens in full browser tab
✅ Timer and breathing animation functional
✅ Break logging to IndexedDB
✅ Context menu actions
✅ Popup dashboard UI

### Next Steps for Full Demo

1. **Enable Camera**: Grant permission when popup requests it
2. **Test Emotion Detection**: Requires face-api.js models in `assets/models/`
3. **Test Posture Detection**: Requires PoseNet models
4. **View Dashboard**: Click "View Full Dashboard" in popup

### Troubleshooting

**Extension won't load:**
- Check console at `chrome://extensions/` for errors
- Verify all icon files exist
- Ensure manifest.json is valid JSON

**Break page doesn't open:**
- Check background.js console logs
- Verify break.html exists in root folder

**Camera permission denied:**
- Go to `chrome://settings/content/camera`
- Allow camera for extensions
- Reload extension

### File Structure
```
/workspace/
├── manifest.json          # Extension config (v0.0.1)
├── background.js          # Service worker
├── content.js            # Content script
├── popup.html/js/css     # Extension popup
├── break.html            # NEW: Full break page
├── dashboard.html/js/css # Analytics dashboard
├── assets/icons/         # PNG icons
└── modules/              # Feature modules
```

### Demo Features Priority

For immediate demo, these work without ML models:
1. ✅ Open break page from popup
2. ✅ Timer and animations
3. ✅ Break logging
4. ✅ Context menu actions
5. ⏳ Emotion display (shows last state or default)
6. ⏳ Posture display (shows last state or default)

For full ML features, download models to `assets/models/`:
- face-api.js models (emotion detection)
- PoseNet model (posture detection)
