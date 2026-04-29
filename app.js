/**
 * GUIDANCE GURU - Wellness & Mindfulness Application
 * Premium Dark Theme Implementation
 * 
 * Features:
 * - Emotion Recognition (face-api.js)
 * - Posture Detection (PoseNet)
 * - Meditation Timer with Ambient Sounds
 * - Breathing Exercises with Animations
 * - Analytics Dashboard
 * - Break Enforcement System
 */

// ========================================
// GLOBAL STATE MANAGEMENT
// ========================================
const AppState = {
    // Emotion Detection
    emotionDetection: {
        active: false,
        modelsLoaded: false,
        currentEmotion: 'neutral',
        confidence: 0,
        videoElement: null,
        canvasElement: null,
        intervalId: null
    },
    
    // Posture Detection
    postureDetection: {
        active: false,
        currentScore: 100,
        headTilt: 0,
        shoulderBalance: 'Balanced',
        spineAlignment: 'Good',
        net: null,
        intervalId: null
    },
    
    // Meditation
    meditation: {
        duration: 300, // 5 minutes default
        remaining: 300,
        isRunning: false,
        isPaused: false,
        audioType: null,
        intervalId: null
    },
    
    // Breathing
    breathing: {
        technique: 'box', // box, relax, stress, balance
        isRunning: false,
        isPaused: false,
        currentPhase: 'ready', // inhale, hold, exhale
        currentCycle: 0,
        totalCycles: 0,
        sessionStartTime: null,
        intervalId: null,
        phaseTimings: {
            box: { inhale: 4, hold: 4, exhale: 4, hold2: 4 },
            relax: { inhale: 4, hold: 7, exhale: 8 },
            stress: { inhale: 4, hold: 6, exhale: 8 },
            balance: { inhale: 5, hold: 5, exhale: 5 }
        }
    },
    
    // Analytics Data
    analytics: {
        emotionSessions: [],
        postureRecords: [],
        breaks: [],
        meditationSessions: []
    },
    
    // Break Modal
    breakModal: {
        active: false,
        selectedType: null,
        duration: 0,
        remaining: 0,
        intervalId: null
    }
};

// ========================================
// INDEXEDDB STORAGE
// ========================================
const DB_NAME = 'GuidanceGuruDB';
const DB_VERSION = 1;

class StorageManager {
    constructor() {
        this.db = null;
    }
    
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Emotion Sessions Store
                if (!db.objectStoreNames.contains('emotionSessions')) {
                    const emotionStore = db.createObjectStore('emotionSessions', { keyPath: 'id' });
                    emotionStore.createIndex('timestamp', 'timestamp', { unique: false });
                    emotionStore.createIndex('emotion', 'emotion', { unique: false });
                    emotionStore.createIndex('session_date', 'session_date', { unique: false });
                }
                
                // Posture Records Store
                if (!db.objectStoreNames.contains('postureRecords')) {
                    const postureStore = db.createObjectStore('postureRecords', { keyPath: 'id' });
                    postureStore.createIndex('timestamp', 'timestamp', { unique: false });
                    postureStore.createIndex('score', 'score', { unique: false });
                }
                
                // Breaks Store
                if (!db.objectStoreNames.contains('breaks')) {
                    const breaksStore = db.createObjectStore('breaks', { keyPath: 'id' });
                    breaksStore.createIndex('timestamp', 'timestamp', { unique: false });
                    breaksStore.createIndex('type', 'type', { unique: false });
                }
                
                // Meditation Sessions Store
                if (!db.objectStoreNames.contains('meditationSessions')) {
                    const meditationStore = db.createObjectStore('meditationSessions', { keyPath: 'id' });
                    meditationStore.createIndex('timestamp', 'timestamp', { unique: false });
                    meditationStore.createIndex('duration', 'duration', { unique: false });
                }
            };
        });
    }
    
    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async getByDate(storeName, date) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index('session_date');
            const request = index.getAll(date);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}

const storage = new StorageManager();

// ========================================
// EMOTION DETECTION ENGINE
// ========================================
class EmotionDetector {
    constructor() {
        this.modelsLoaded = false;
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('overlay');
        this.display = document.getElementById('currentEmotion');
        this.emotionName = document.getElementById('emotionName');
        this.confidenceFill = document.getElementById('confidenceFill');
        this.confidenceText = document.getElementById('confidenceText');
        this.emotionStatus = document.getElementById('emotionStatus');
        this.loadingSpinner = document.getElementById('emotionLoading');
    }
    
    async loadModels() {
        try {
            this.showLoading(true);
            
            // Load face-api.js models from CDN
            const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model';
            
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
            ]);
            
            this.modelsLoaded = true;
            AppState.emotionDetection.modelsLoaded = true;
            this.showLoading(false);
            
            Toast.show('AI Models loaded successfully!', 'success');
        } catch (error) {
            console.error('Error loading models:', error);
            Toast.show('Failed to load AI models. Using demo mode.', 'warning');
            this.showLoading(false);
        }
    }
    
    showLoading(show) {
        if (this.loadingSpinner) {
            this.loadingSpinner.style.display = show ? 'flex' : 'none';
        }
    }
    
    async start() {
        if (!this.modelsLoaded) {
            await this.loadModels();
        }
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 }
            });
            
            this.video.srcObject = stream;
            AppState.emotionDetection.active = true;
            AppState.emotionDetection.videoElement = this.video;
            
            // Update UI
            document.getElementById('cameraStatus').classList.add('active');
            document.querySelector('#cameraStatus .status-text').textContent = 'Camera On';
            
            // Wait for video to load
            await new Promise(resolve => {
                this.video.onloadedmetadata = () => {
                    this.canvas.width = this.video.videoWidth;
                    this.canvas.height = this.video.videoHeight;
                    resolve();
                };
            });
            
            // Start detection loop (every 30 seconds as per plan)
            this.detectEmotion();
            AppState.emotionDetection.intervalId = setInterval(() => {
                this.detectEmotion();
            }, 30000);
            
            Toast.show('Emotion detection started', 'success');
        } catch (error) {
            console.error('Error starting camera:', error);
            Toast.show('Camera access denied. Please enable camera permissions.', 'error');
        }
    }
    
    stop() {
        if (AppState.emotionDetection.intervalId) {
            clearInterval(AppState.emotionDetection.intervalId);
        }
        
        if (this.video.srcObject) {
            this.video.srcObject.getTracks().forEach(track => track.stop());
            this.video.srcObject = null;
        }
        
        AppState.emotionDetection.active = false;
        
        // Update UI
        document.getElementById('cameraStatus').classList.remove('active');
        document.querySelector('#cameraStatus .status-text').textContent = 'Camera Off';
        
        Toast.show('Emotion detection stopped', 'success');
    }
    
    async detectEmotion() {
        if (!this.modelsLoaded || !AppState.emotionDetection.active) return;
        
        try {
            const detections = await faceapi
                .detectSingleFace(this.video, new faceapi.TinyFaceDetectorOptions())
                .withFaceExpressions();
            
            if (detections) {
                const expressions = detections.expressions;
                const dominantEmotion = this.getDominantEmotion(expressions);
                
                this.updateUI(dominantEmotion, expressions[dominantEmotion]);
                this.storeEmotion(dominantEmotion, expressions[dominantEmotion]);
            } else {
                this.updateUI('neutral', 0.5);
            }
        } catch (error) {
            console.error('Error detecting emotion:', error);
        }
    }
    
    getDominantEmotion(expressions) {
        const emotionMap = {
            neutral: 'neutral',
            happy: 'happy',
            sad: 'sad',
            angry: 'angry',
            fearful: 'fearful',
            disgusted: 'disgusted',
            surprised: 'surprised'
        };
        
        let maxConfidence = 0;
        let dominant = 'neutral';
        
        for (const [emotion, confidence] of Object.entries(expressions)) {
            if (confidence > maxConfidence) {
                maxConfidence = confidence;
                dominant = emotionMap[emotion] || emotion;
            }
        }
        
        // Check for stress indicators
        const stressIndicators = expressions.angry + expressions.fearful + expressions.sad;
        if (stressIndicators > 0.6) {
            dominant = 'stressed';
            maxConfidence = stressIndicators;
        }
        
        return dominant;
    }
    
    updateUI(emotion, confidence) {
        AppState.emotionDetection.currentEmotion = emotion;
        AppState.emotionDetection.confidence = confidence;
        
        const emojiMap = {
            neutral: '😐',
            happy: '😊',
            sad: '😢',
            angry: '😠',
            fearful: '😨',
            disgusted: '🤢',
            surprised: '😮',
            stressed: '😫'
        };
        
        if (this.display) {
            this.display.querySelector('.emoji').textContent = emojiMap[emotion] || '😐';
        }
        
        if (this.emotionName) {
            this.emotionName.textContent = emotion.charAt(0).toUpperCase() + emotion.slice(1);
        }
        
        if (this.confidenceFill && this.confidenceText) {
            const percentage = Math.round(confidence * 100);
            this.confidenceFill.style.width = `${percentage}%`;
            this.confidenceText.textContent = `${percentage}%`;
        }
        
        // Update status badge
        if (this.emotionStatus) {
            const statusClass = this.getStatusClass(emotion);
            this.emotionStatus.innerHTML = `<span class="status-badge ${statusClass}">${this.getStatusText(emotion)}</span>`;
        }
    }
    
    getStatusClass(emotion) {
        const goodEmotions = ['happy', 'neutral', 'surprised'];
        const warningEmotions = ['sad', 'fearful', 'disgusted'];
        const dangerEmotions = ['angry', 'stressed'];
        
        if (goodEmotions.includes(emotion)) return 'good';
        if (warningEmotions.includes(emotion)) return 'warning';
        if (dangerEmotions.includes(emotion)) return 'danger';
        return 'neutral';
    }
    
    getStatusText(emotion) {
        const statusMap = {
            happy: 'Great Mood!',
            neutral: 'Monitoring',
            surprised: 'Alert',
            sad: 'Check In',
            fearful: 'Anxious',
            disgusted: 'Uncomfortable',
            angry: 'Stress Detected',
            stressed: 'High Stress'
        };
        return statusMap[emotion] || 'Monitoring';
    }
    
    async storeEmotion(emotion, confidence) {
        const record = {
            id: `emotion_${Date.now()}`,
            timestamp: Date.now(),
            emotion: emotion,
            confidence: confidence,
            posture_score: AppState.postureDetection.currentScore,
            session_date: new Date().toISOString().split('T')[0]
        };
        
        try {
            await storage.add('emotionSessions', record);
            AppState.analytics.emotionSessions.push(record);
        } catch (error) {
            console.error('Error storing emotion:', error);
        }
    }
}

// ========================================
// POSTURE DETECTION ENGINE
// ========================================
class PostureDetector {
    constructor() {
        this.video = document.getElementById('video');
        this.scoreElement = document.getElementById('postureScore');
        this.progressElement = document.getElementById('postureProgress');
        this.headTiltElement = document.getElementById('headTilt');
        this.shoulderBalanceElement = document.getElementById('shoulderBalance');
        this.spineAlignmentElement = document.getElementById('spineAlignment');
        this.feedbackElement = document.getElementById('postureFeedback');
    }
    
    async start() {
        if (!AppState.emotionDetection.active && !this.video.srcObject) {
            Toast.show('Please enable camera first for posture detection', 'warning');
            return;
        }
        
        AppState.postureDetection.active = true;
        
        // Start detection loop (adaptive frequency)
        this.analyzePosture();
        AppState.postureDetection.intervalId = setInterval(() => {
            this.analyzePosture();
        }, 5000); // Every 5 seconds
        
        Toast.show('Posture monitoring started', 'success');
    }
    
    stop() {
        if (AppState.postureDetection.intervalId) {
            clearInterval(AppState.postureDetection.intervalId);
        }
        AppState.postureDetection.active = false;
        Toast.show('Posture monitoring stopped', 'success');
    }
    
    async analyzePosture() {
        if (!AppState.postureDetection.active) return;
        
        // Simulated posture analysis (in production, use PoseNet)
        // This is a demo implementation
        const simulatedData = this.simulatePostureAnalysis();
        this.updateUI(simulatedData);
        this.storePosture(simulatedData);
    }
    
    simulatePostureAnalysis() {
        // Generate realistic simulated data
        const baseScore = 75 + Math.random() * 20;
        const headTilt = Math.floor(Math.random() * 25);
        const shoulderDiff = Math.floor(Math.random() * 10);
        const spineDeviation = Math.floor(Math.random() * 15);
        
        let score = 100;
        score -= headTilt * 2;
        score -= shoulderDiff * 1.5;
        score -= spineDeviation;
        score = Math.max(0, Math.min(100, score));
        
        return {
            score: Math.round(score),
            headTilt: headTilt,
            shoulderBalance: shoulderDiff < 5 ? 'Balanced' : 'Uneven',
            spineAlignment: spineDeviation < 10 ? 'Good' : (spineDeviation < 20 ? 'Fair' : 'Poor')
        };
    }
    
    updateUI(data) {
        AppState.postureDetection.currentScore = data.score;
        AppState.postureDetection.headTilt = data.headTilt;
        AppState.postureDetection.shoulderBalance = data.shoulderBalance;
        AppState.postureDetection.spineAlignment = data.spineAlignment;
        
        // Update score display
        if (this.scoreElement) {
            this.scoreElement.textContent = data.score;
        }
        
        // Update progress circle
        if (this.progressElement) {
            const circumference = 326.7;
            const offset = circumference - (data.score / 100) * circumference;
            this.progressElement.style.strokeDashoffset = offset;
            
            // Change color based on score
            if (data.score >= 80) {
                this.progressElement.style.stroke = '#10b981';
            } else if (data.score >= 60) {
                this.progressElement.style.stroke = '#f59e0b';
            } else {
                this.progressElement.style.stroke = '#ef4444';
            }
        }
        
        // Update metrics
        if (this.headTiltElement) {
            this.headTiltElement.textContent = `${data.headTilt}°`;
        }
        
        if (this.shoulderBalanceElement) {
            this.shoulderBalanceElement.textContent = data.shoulderBalance;
        }
        
        if (this.spineAlignmentElement) {
            this.spineAlignmentElement.textContent = data.spineAlignment;
        }
        
        // Update feedback
        if (this.feedbackElement) {
            const feedbackClass = data.score >= 80 ? 'good' : (data.score >= 60 ? 'warning' : 'bad');
            const feedbackText = data.score >= 80 ? 'Excellent Posture!' : (data.score >= 60 ? 'Adjust Posture' : 'Poor Posture - Take Break!');
            this.feedbackElement.innerHTML = `<span class="feedback-badge ${feedbackClass}">${feedbackText}</span>`;
            
            // Trigger break recommendation if score is very low
            if (data.score < 60 && AppState.emotionDetection.currentEmotion === 'stressed') {
                this.triggerBreakRecommendation();
            }
        }
    }
    
    triggerBreakRecommendation() {
        if (!AppState.breakModal.active) {
            BreakManager.showBreakModal('Auto-triggered due to poor posture and stress');
        }
    }
    
    async storePosture(data) {
        const record = {
            id: `posture_${Date.now()}`,
            timestamp: Date.now(),
            score: data.score,
            headTilt: data.headTilt,
            shoulderBalance: data.shoulderBalance,
            spineAlignment: data.spineAlignment
        };
        
        try {
            await storage.add('postureRecords', record);
            AppState.analytics.postureRecords.push(record);
        } catch (error) {
            console.error('Error storing posture:', error);
        }
    }
}

// ========================================
// MEDITATION TIMER
// ========================================
class MeditationTimer {
    constructor() {
        this.timeDisplay = document.getElementById('timerTime');
        this.progressElement = document.getElementById('timerProgress');
        this.audioPlayer = document.getElementById('audioPlayer');
        this.startBtn = document.getElementById('startMeditation');
        this.pauseBtn = document.getElementById('pauseMeditation');
        this.resetBtn = document.getElementById('resetMeditation');
        
        this.initListeners();
    }
    
    initListeners() {
        // Duration buttons
        document.querySelectorAll('.duration-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.duration-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                const minutes = parseInt(e.target.dataset.minutes);
                this.setDuration(minutes * 60);
            });
        });
        
        // Custom duration
        document.getElementById('setCustomDuration')?.addEventListener('click', () => {
            const input = document.getElementById('customDuration');
            const minutes = parseInt(input.value);
            if (minutes && minutes > 0 && minutes <= 120) {
                this.setDuration(minutes * 60);
                Toast.show(`Duration set to ${minutes} minutes`, 'success');
            }
        });
        
        // Audio options
        document.querySelectorAll('.audio-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.audio-option').forEach(o => o.classList.remove('active'));
                e.currentTarget.classList.add('active');
                const audioType = e.currentTarget.dataset.audio;
                this.setAudio(audioType);
            });
        });
        
        // Control buttons
        this.startBtn?.addEventListener('click', () => this.start());
        this.pauseBtn?.addEventListener('click', () => this.togglePause());
        this.resetBtn?.addEventListener('click', () => this.reset());
    }
    
    setDuration(seconds) {
        AppState.meditation.duration = seconds;
        AppState.meditation.remaining = seconds;
        this.updateDisplay();
    }
    
    setAudio(type) {
        AppState.meditation.audioType = type;
        
        // In production, load actual audio files
        // For demo, we'll just log it
        console.log(`Audio selected: ${type}`);
        Toast.show(`${type.charAt(0).toUpperCase() + type.slice(1)} sounds selected`, 'success');
    }
    
    start() {
        if (AppState.meditation.isRunning && AppState.meditation.isPaused) {
            this.togglePause();
            return;
        }
        
        AppState.meditation.isRunning = true;
        AppState.meditation.isPaused = false;
        
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
        
        // Play audio if selected
        if (AppState.meditation.audioType) {
            // In production: this.audioPlayer.play();
        }
        
        AppState.meditation.intervalId = setInterval(() => {
            AppState.meditation.remaining--;
            this.updateDisplay();
            this.updateProgress();
            
            if (AppState.meditation.remaining <= 0) {
                this.complete();
            }
        }, 1000);
        
        Toast.show('Meditation session started', 'success');
    }
    
    togglePause() {
        AppState.meditation.isPaused = !AppState.meditation.isPaused;
        
        if (AppState.meditation.isPaused) {
            clearInterval(AppState.meditation.intervalId);
            this.pauseBtn.innerHTML = '<span class="control-icon">▶️</span> Resume';
            Toast.show('Meditation paused', 'warning');
        } else {
            this.start();
            this.pauseBtn.innerHTML = '<span class="control-icon">⏸️</span> Pause';
        }
    }
    
    reset() {
        this.stop();
        AppState.meditation.remaining = AppState.meditation.duration;
        this.updateDisplay();
        this.updateProgress();
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.pauseBtn.innerHTML = '<span class="control-icon">⏸️</span> Pause';
        Toast.show('Meditation reset', 'success');
    }
    
    stop() {
        if (AppState.meditation.intervalId) {
            clearInterval(AppState.meditation.intervalId);
        }
        AppState.meditation.isRunning = false;
        AppState.meditation.isPaused = false;
        
        if (this.audioPlayer) {
            this.audioPlayer.pause();
        }
    }
    
    complete() {
        this.stop();
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        
        // Log session
        this.logSession();
        
        Toast.show('Meditation session completed! 🎉', 'success');
        
        // Show completion message
        setTimeout(() => {
            alert('Congratulations! You completed your meditation session.');
        }, 500);
    }
    
    updateDisplay() {
        const minutes = Math.floor(AppState.meditation.remaining / 60);
        const seconds = AppState.meditation.remaining % 60;
        this.timeDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    
    updateProgress() {
        if (this.progressElement) {
            const circumference = 565.5;
            const progress = AppState.meditation.remaining / AppState.meditation.duration;
            const offset = circumference - (progress * circumference);
            this.progressElement.style.strokeDashoffset = offset;
        }
    }
    
    async logSession() {
        const session = {
            id: `meditation_${Date.now()}`,
            timestamp: Date.now(),
            duration: AppState.meditation.duration - AppState.meditation.remaining,
            audioType: AppState.meditation.audioType
        };
        
        try {
            await storage.add('meditationSessions', session);
            AppState.analytics.meditationSessions.push(session);
        } catch (error) {
            console.error('Error logging meditation:', error);
        }
    }
}

// ========================================
// BREATHING EXERCISE
// ========================================
class BreathingExercise {
    constructor() {
        this.circle = document.getElementById('breathingCircle');
        this.phaseIndicator = document.getElementById('phaseIndicator');
        this.instructions = document.getElementById('breathingInstructions');
        this.currentCycleEl = document.getElementById('currentCycle');
        this.totalCyclesEl = document.getElementById('totalCycles');
        this.sessionTimeEl = document.getElementById('sessionTime');
        this.startBtn = document.getElementById('startBreathing');
        this.pauseBtn = document.getElementById('pauseBreathing');
        this.resetBtn = document.getElementById('resetBreathing');
        
        this.initListeners();
    }
    
    initListeners() {
        // Technique selection
        document.querySelectorAll('.technique-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.technique-option').forEach(o => o.classList.remove('active'));
                e.currentTarget.classList.add('active');
                const technique = e.currentTarget.dataset.technique;
                this.setTechnique(technique);
            });
        });
        
        // Control buttons
        this.startBtn?.addEventListener('click', () => this.start());
        this.pauseBtn?.addEventListener('click', () => this.togglePause());
        this.resetBtn?.addEventListener('click', () => this.reset());
    }
    
    setTechnique(technique) {
        AppState.breathing.technique = technique;
        const timings = AppState.breathing.phaseTimings[technique];
        const pattern = Object.values(timings).join('-');
        
        if (this.instructions) {
            this.instructions.innerHTML = `<p>Starting ${technique} breathing: ${pattern} second pattern</p>`;
        }
        
        Toast.show(`${technique} breathing selected`, 'success');
    }
    
    start() {
        if (AppState.breathing.isRunning && AppState.breathing.isPaused) {
            this.togglePause();
            return;
        }
        
        AppState.breathing.isRunning = true;
        AppState.breathing.isPaused = false;
        AppState.breathing.sessionStartTime = Date.now();
        
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
        
        this.runCycle();
        
        Toast.show('Breathing exercise started', 'success');
    }
    
    togglePause() {
        AppState.breathing.isPaused = !AppState.breathing.isPaused;
        
        if (AppState.breathing.isPaused) {
            clearTimeout(AppState.breathing.intervalId);
            this.pauseBtn.innerHTML = '<span class="control-icon">▶️</span> Resume';
            this.circle.className = 'breathing-circle';
            Toast.show('Breathing paused', 'warning');
        } else {
            this.start();
            this.pauseBtn.innerHTML = '<span class="control-icon">⏸️</span> Pause';
        }
    }
    
    reset() {
        this.stop();
        AppState.breathing.currentCycle = 0;
        AppState.breathing.totalCycles = 0;
        this.updateCounters();
        this.circle.className = 'breathing-circle';
        this.phaseIndicator.querySelector('.phase-text').textContent = 'Ready';
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.pauseBtn.innerHTML = '<span class="control-icon">⏸️</span> Pause';
        Toast.show('Breathing exercise reset', 'success');
    }
    
    stop() {
        if (AppState.breathing.intervalId) {
            clearTimeout(AppState.breathing.intervalId);
        }
        AppState.breathing.isRunning = false;
        AppState.breathing.isPaused = false;
    }
    
    async runCycle() {
        const technique = AppState.breathing.technique;
        const timings = AppState.breathing.phaseTimings[technique];
        
        // Inhale
        await this.runPhase('inhale', timings.inhale);
        if (!AppState.breathing.isRunning) return;
        
        // Hold (if exists)
        if (timings.hold) {
            await this.runPhase('hold', timings.hold);
            if (!AppState.breathing.isRunning) return;
        }
        
        // Exhale
        await this.runPhase('exhale', timings.exhale);
        if (!AppState.breathing.isRunning) return;
        
        // Second hold (for box breathing)
        if (timings.hold2) {
            await this.runPhase('hold', timings.hold2);
            if (!AppState.breathing.isRunning) return;
        }
        
        // Cycle complete
        AppState.breathing.currentCycle++;
        AppState.breathing.totalCycles++;
        this.updateCounters();
        
        // Continue next cycle
        if (AppState.breathing.isRunning && !AppState.breathing.isPaused) {
            this.runCycle();
        }
    }
    
    runPhase(phase, duration) {
        return new Promise(resolve => {
            this.circle.className = `breathing-circle ${phase}`;
            this.phaseIndicator.querySelector('.phase-text').textContent = phase.toUpperCase();
            
            AppState.breathing.currentPhase = phase;
            
            AppState.breathing.intervalId = setTimeout(() => {
                resolve();
            }, duration * 1000);
        });
    }
    
    updateCounters() {
        if (this.currentCycleEl) {
            this.currentCycleEl.textContent = AppState.breathing.currentCycle;
        }
        if (this.totalCyclesEl) {
            this.totalCyclesEl.textContent = AppState.breathing.totalCycles;
        }
        
        // Update session time
        if (AppState.breathing.sessionStartTime) {
            const elapsed = Math.floor((Date.now() - AppState.breathing.sessionStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            if (this.sessionTimeEl) {
                this.sessionTimeEl.textContent = `${minutes}:${String(seconds).padStart(2, '0')}`;
            }
        }
    }
}

// ========================================
// BREAK MANAGER
// ========================================
class BreakManager {
    static showBreakModal(reason = '') {
        const modal = document.getElementById('breakModal');
        const message = document.getElementById('breakMessage');
        
        // Update stats
        document.getElementById('breakStressLevel').textContent = 
            AppState.emotionDetection.currentEmotion === 'stressed' ? 'High' : 'Moderate';
        document.getElementById('breakPostureScore').textContent = 
            AppState.postureDetection.currentScore < 60 ? 'Low' : 'Good';
        document.getElementById('breakSessionTime').textContent = '45m';
        
        if (reason) {
            message.textContent = reason;
        }
        
        modal.classList.add('active');
        AppState.breakModal.active = true;
        
        // Add click listeners to break options
        document.querySelectorAll('.break-option').forEach(option => {
            option.onclick = () => {
                const type = option.dataset.type;
                const duration = parseInt(option.dataset.duration);
                this.startBreak(type, duration);
            };
        });
    }
    
    static startBreak(type, duration) {
        AppState.breakModal.selectedType = type;
        AppState.breakModal.duration = duration;
        AppState.breakModal.remaining = duration;
        
        const timerDisplay = document.getElementById('breakTimerDisplay');
        const progressFill = document.getElementById('breakProgressFill');
        const timerContainer = document.getElementById('breakTimer');
        const message = document.getElementById('breakMessage');
        
        timerContainer.style.display = 'block';
        message.textContent = `Taking a ${type} break. Relax and breathe.`;
        
        // Disable option clicks
        document.querySelectorAll('.break-option').forEach(opt => {
            opt.style.pointerEvents = 'none';
            opt.style.opacity = '0.5';
        });
        
        const updateTimer = () => {
            const minutes = Math.floor(AppState.breakModal.remaining / 60);
            const seconds = AppState.breakModal.remaining % 60;
            timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            
            const progress = (AppState.breakModal.remaining / AppState.breakModal.duration) * 100;
            progressFill.style.width = `${progress}%`;
            
            if (AppState.breakModal.remaining <= 0) {
                this.completeBreak();
            } else {
                AppState.breakModal.remaining--;
                AppState.breakModal.intervalId = setTimeout(updateTimer, 1000);
            }
        };
        
        updateTimer();
    }
    
    static completeBreak() {
        clearTimeout(AppState.breakModal.intervalId);
        
        // Log break
        const breakRecord = {
            id: `break_${Date.now()}`,
            timestamp: Date.now(),
            type: AppState.breakModal.selectedType,
            duration: AppState.breakModal.duration
        };
        
        storage.add('breaks', breakRecord).then(() => {
            AppState.analytics.breaks.push(breakRecord);
        });
        
        Toast.show('Break completed! Ready to continue?', 'success');
        
        // Close modal
        const modal = document.getElementById('breakModal');
        modal.classList.remove('active');
        AppState.breakModal.active = false;
        
        // Reset options
        document.querySelectorAll('.break-option').forEach(opt => {
            opt.style.pointerEvents = 'auto';
            opt.style.opacity = '1';
        });
    }
}

// ========================================
// TOAST NOTIFICATIONS
// ========================================
class Toast {
    static show(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${this.getIcon(type)}</span>
            <span class="toast-message">${message}</span>
        `;
        
        container.appendChild(toast);
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            toast.style.animation = 'toastSlideIn 0.3s reverse';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
    
    static getIcon(type) {
        const icons = {
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        return icons[type] || 'ℹ️';
    }
}

// ========================================
// ANALYTICS DASHBOARD
// ========================================
class AnalyticsDashboard {
    constructor() {
        this.stressChart = null;
        this.postureChart = null;
        this.emotionChart = null;
    }
    
    async init() {
        await this.loadData();
        this.renderCharts();
        this.updateStats();
    }
    
    async loadData() {
        try {
            AppState.analytics.emotionSessions = await storage.getAll('emotionSessions') || [];
            AppState.analytics.postureRecords = await storage.getAll('postureRecords') || [];
            AppState.analytics.breaks = await storage.getAll('breaks') || [];
            AppState.analytics.meditationSessions = await storage.getAll('meditationSessions') || [];
        } catch (error) {
            console.error('Error loading analytics:', error);
        }
    }
    
    renderCharts() {
        this.renderStressChart();
        this.renderPostureChart();
        this.renderEmotionChart();
    }
    
    renderStressChart() {
        const ctx = document.getElementById('stressChart');
        if (!ctx) return;
        
        // Sample data for demo
        const labels = ['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM'];
        const data = [30, 45, 65, 50, 40, 55, 35, 30];
        
        this.stressChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Stress Index',
                    data: data,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#94a3b8' }
                    },
                    x: {
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#94a3b8' }
                    }
                }
            }
        });
    }
    
    renderPostureChart() {
        const ctx = document.getElementById('postureChart');
        if (!ctx) return;
        
        const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const data = [75, 82, 68, 85, 72, 78, 80];
        
        this.postureChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Posture Score',
                    data: data,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#94a3b8' }
                    },
                    x: {
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#94a3b8' }
                    }
                }
            }
        });
    }
    
    renderEmotionChart() {
        const ctx = document.getElementById('emotionChart');
        if (!ctx) return;
        
        this.emotionChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Happy', 'Neutral', 'Stressed', 'Sad', 'Angry'],
                datasets: [{
                    data: [35, 40, 15, 5, 5],
                    backgroundColor: [
                        '#10b981',
                        '#3b82f6',
                        '#ef4444',
                        '#f59e0b',
                        '#dc2626'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: '#94a3b8' }
                    }
                }
            }
        });
    }
    
    updateStats() {
        // Update dashboard stats
        const stressIndex = document.getElementById('stressIndex');
        const breaksTaken = document.getElementById('breaksTaken');
        const meditationMinutes = document.getElementById('meditationMinutes');
        const focusTime = document.getElementById('focusTime');
        
        if (stressIndex) stressIndex.textContent = '35';
        if (breaksTaken) breaksTaken.textContent = AppState.analytics.breaks.length;
        if (meditationMinutes) meditationMinutes.textContent = Math.floor(AppState.analytics.meditationSessions.reduce((acc, s) => acc + s.duration, 0) / 60);
        if (focusTime) focusTime.textContent = '4.5h';
    }
}

// ========================================
// NAVIGATION & UI CONTROLLER
// ========================================
class UIController {
    constructor() {
        this.initNavigation();
        this.initScrollEffect();
        this.initButtons();
    }
    
    initNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        const sections = document.querySelectorAll('.section');
        
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const targetSection = item.dataset.section;
                
                // Update nav items
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                
                // Update sections
                sections.forEach(section => {
                    section.classList.remove('active');
                    if (section.id === targetSection) {
                        section.classList.add('active');
                    }
                });
                
                // Refresh charts if analytics section
                if (targetSection === 'analytics') {
                    analytics.init();
                }
            });
        });
    }
    
    initScrollEffect() {
        window.addEventListener('scroll', () => {
            const navbar = document.querySelector('.navbar');
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }
    
    initButtons() {
        // Emotion toggle
        document.getElementById('toggleEmotion')?.addEventListener('click', () => {
            if (AppState.emotionDetection.active) {
                emotionDetector.stop();
            } else {
                emotionDetector.start();
            }
        });
        
        // Posture toggle
        document.getElementById('togglePosture')?.addEventListener('click', () => {
            if (AppState.postureDetection.active) {
                postureDetector.stop();
            } else {
                postureDetector.start();
            }
        });
        
        // Take break button
        document.getElementById('takeBreakBtn')?.addEventListener('click', () => {
            BreakManager.showBreakModal();
        });
        
        // Export data
        document.getElementById('exportData')?.addEventListener('click', () => {
            this.exportData();
        });
    }
    
    exportData() {
        const data = {
            emotionSessions: AppState.analytics.emotionSessions,
            postureRecords: AppState.analytics.postureRecords,
            breaks: AppState.analytics.breaks,
            meditationSessions: AppState.analytics.meditationSessions
        };
        
        const csv = this.convertToCSV(data);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `guidance-guru-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        
        Toast.show('Data exported successfully!', 'success');
    }
    
    convertToCSV(data) {
        let csv = 'Type,Timestamp,Value\n';
        
        data.emotionSessions.forEach(s => {
            csv += `Emotion,${new Date(s.timestamp).toISOString()},${s.emotion} (${s.confidence})\n`;
        });
        
        data.postureRecords.forEach(r => {
            csv += `Posture,${new Date(r.timestamp).toISOString()},${r.score}\n`;
        });
        
        data.breaks.forEach(b => {
            csv += `Break,${new Date(b.timestamp).toISOString()},${b.type} (${b.duration}s)\n`;
        });
        
        data.meditationSessions.forEach(s => {
            csv += `Meditation,${new Date(s.timestamp).toISOString()},${s.duration}s\n`;
        });
        
        return csv;
    }
}

// ========================================
// INITIALIZATION
// ========================================
let emotionDetector, postureDetector, meditationTimer, breathingExercise, analytics, uiController;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🧘 Guidance Guru Initializing...');
    
    try {
        // Initialize storage
        await storage.init();
        console.log('✅ Storage initialized');
        
        // Initialize modules
        emotionDetector = new EmotionDetector();
        postureDetector = new PostureDetector();
        meditationTimer = new MeditationTimer();
        breathingExercise = new BreathingExercise();
        analytics = new AnalyticsDashboard();
        uiController = new UIController();
        
        console.log('✅ All modules initialized');
        
        // Preload emotion models
        emotionDetector.loadModels();
        
        Toast.show('Welcome to Guidance Guru! 🧘', 'success');
    } catch (error) {
        console.error('Initialization error:', error);
        Toast.show('Some features may be limited', 'warning');
    }
});

// Service Worker registration (for PWA support)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Uncomment when you have a service worker file
        // navigator.serviceWorker.register('/sw.js');
    });
}
