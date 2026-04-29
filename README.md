# Guidance Guru - Meditation & Breathing Website

## Version 0.0.1 - Demo Ready! 🎉

A beautiful, calming wellness website featuring meditation timer and breathing exercises.

## Features

### 🧘 Section 1: Meditation Timer
- **Preset Durations**: 5, 10, 15, 30 minutes
- **Custom Duration**: Enter any duration from 1-120 minutes
- **Ambient Sounds**: Choose from Forest, Rain, or Ocean
- **Visual Progress Ring**: Beautiful circular timer that depletes as time passes
- **Start/Pause/Reset Controls**: Full control over your session
- **Session Tracking**: Automatically saves completed sessions to localStorage

### 💨 Section 2: Breathing Exercises
- **4 Breathing Techniques**:
  - **Box Breathing** (4-4-4-4): Perfect for beginners, great for focus
  - **4-7-8 Relax**: Deep relaxation technique
  - **Stress Relief** (4-6-8): Releases tension and anxiety
  - **Anxiety Calm** (5-5-5): Balanced rhythm for calming nerves
  
- **Super Animation**: 
  - Inhale: Circle expands with blue glow
  - Hold: Circle maintains size with intensified glow
  - Exhale: Circle contracts smoothly
  
- **Real-time Stats**: 
  - Cycles completed counter
  - Session timer
  
- **Phase Instructions**: Clear guidance for each breathing phase

## How to Use

### Option 1: Open Directly
Simply open `index.html` in any modern web browser (Chrome, Firefox, Safari, Edge).

### Option 2: Local Server (Recommended)
For the best experience, serve the files locally:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (if you have npx)
npx serve

# Using PHP
php -S localhost:8000
```

Then navigate to `http://localhost:8000`

## File Structure

```
/workspace/
├── index.html      # Main HTML file
├── styles.css      # All styling (blue theme, animations)
├── app.js          # Application logic
└── README.md       # This file
```

## Technical Details

### Technologies Used
- **HTML5**: Semantic structure
- **CSS3**: Flexbox, Grid, CSS Variables, Animations
- **Vanilla JavaScript (ES6+)**: Classes, arrow functions, localStorage

### Key Features
- ✅ **Responsive Design**: Works on desktop, tablet, and mobile
- ✅ **No Dependencies**: Pure vanilla JS, no frameworks needed
- ✅ **Offline Capable**: Works without internet connection
- ✅ **LocalStorage**: Sessions persist between visits
- ✅ **Smooth Animations**: 60fps CSS transitions

### Browser Compatibility
- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

## Customization

### Colors
Edit CSS variables in `styles.css`:
```css
:root {
    --primary-blue: #2563eb;
    --light-blue: #dbeafe;
    --accent-blue: #0ea5e9;
    --calm-green: #10b981;
}
```

### Breathing Patterns
Modify techniques in `app.js`:
```javascript
this.techniques = {
    box: {
        pattern: [
            { phase: 'inhale', duration: 4 },
            { phase: 'hold', duration: 4 },
            { phase: 'exhale', duration: 4 },
            { phase: 'hold', duration: 4 }
        ]
    }
};
```

## Future Enhancements (v0.0.2+)
- [ ] Actual ambient audio files (Forest, Rain, Ocean sounds)
- [ ] Web Audio API for generated soundscapes
- [ ] User accounts and cloud sync
- [ ] More breathing techniques
- [ ] Guided meditations
- [ ] Progress charts and analytics
- [ ] Dark mode option
- [ ] PWA support for mobile installation

## Screenshots

The app features:
- Beautiful gradient purple background
- Clean white cards with blue accents
- Animated breathing circle that expands/contracts
- Circular progress timer for meditation
- Responsive navigation bar
- Smooth section transitions

## License

MIT License - Feel free to use and modify!

---

**Created with ❤️ for wellness and mindfulness**

*Guidance Guru v0.0.1 - Your path to inner peace starts here.*
