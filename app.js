// Guidance Guru - Meditation & Breathing App
// Version 0.0.1

// ==================== Navigation ====================
const navLinks = document.querySelectorAll('.nav-links a');
const sections = document.querySelectorAll('.section');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        
        // Update nav links
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        // Update sections
        sections.forEach(section => {
            section.classList.remove('active');
            if (section.id === targetId) {
                section.classList.add('active');
            }
        });
    });
});

// ==================== Meditation Timer ====================
class MeditationTimer {
    constructor() {
        this.duration = 5 * 60; // Default 5 minutes in seconds
        this.timeLeft = this.duration;
        this.isRunning = false;
        this.isPaused = false;
        this.interval = null;
        this.audioContext = null;
        this.currentAudio = 'forest';
        
        // DOM Elements
        this.minutesEl = document.getElementById('minutes');
        this.secondsEl = document.getElementById('seconds');
        this.timerStatus = document.getElementById('timerStatus');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.progressCircle = document.querySelector('.progress-ring-circle');
        this.customTimeInput = document.getElementById('customTime');
        this.setCustomBtn = document.getElementById('setCustomDuration');
        
        // Initialize
        this.init();
    }
    
    init() {
        // Set initial progress circle
        const circumference = 2 * Math.PI * 130;
        this.progressCircle.style.strokeDasharray = circumference;
        this.progressCircle.style.strokeDashoffset = 0;
        
        // Event Listeners
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
        
        // Duration buttons
        document.querySelectorAll('.duration-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.duration-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.setDuration(parseInt(e.target.dataset.duration));
            });
        });
        
        // Custom duration
        this.setCustomBtn.addEventListener('click', () => {
            const custom = parseInt(this.customTimeInput.value);
            if (custom && custom > 0 && custom <= 120) {
                this.setDuration(custom);
                document.querySelectorAll('.duration-btn').forEach(b => b.classList.remove('active'));
            }
        });
        
        // Audio selection
        document.querySelectorAll('input[name="audio"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.currentAudio = e.target.value;
            });
        });
        
        // Set first duration button as active
        document.querySelector('.duration-btn[data-duration="5"]').classList.add('active');
    }
    
    setDuration(minutes) {
        this.duration = minutes * 60;
        this.timeLeft = this.duration;
        this.updateDisplay();
        this.updateProgress();
    }
    
    updateDisplay() {
        const mins = Math.floor(this.timeLeft / 60);
        const secs = this.timeLeft % 60;
        this.minutesEl.textContent = String(mins).padStart(2, '0');
        this.secondsEl.textContent = String(secs).padStart(2, '0');
    }
    
    updateProgress() {
        const circumference = 2 * Math.PI * 130;
        const offset = circumference - (this.timeLeft / this.duration) * circumference;
        this.progressCircle.style.strokeDashoffset = offset;
    }
    
    start() {
        if (this.isRunning && !this.isPaused) return;
        
        if (this.isPaused) {
            this.isPaused = false;
            this.timerStatus.textContent = 'Meditating...';
        } else {
            this.isRunning = true;
            this.timerStatus.textContent = 'Meditating...';
            this.playAmbientSound();
        }
        
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
        
        this.interval = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            this.updateProgress();
            
            if (this.timeLeft <= 0) {
                this.complete();
            }
        }, 1000);
    }
    
    pause() {
        if (!this.isRunning || this.isPaused) return;
        
        this.isPaused = true;
        clearInterval(this.interval);
        this.timerStatus.textContent = 'Paused';
        this.startBtn.disabled = false;
        this.startBtn.textContent = '▶ Resume';
        this.pauseBtn.disabled = true;
        this.stopAmbientSound();
    }
    
    reset() {
        this.stop();
        this.timeLeft = this.duration;
        this.updateDisplay();
        this.updateProgress();
        this.timerStatus.textContent = 'Ready to meditate';
        this.startBtn.textContent = '▶ Start';
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
    }
    
    stop() {
        this.isRunning = false;
        this.isPaused = false;
        clearInterval(this.interval);
        this.stopAmbientSound();
    }
    
    complete() {
        this.stop();
        this.timerStatus.textContent = '🎉 Session Complete!';
        this.startBtn.textContent = '▶ Start';
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.playCompletionSound();
        
        // Save session
        this.saveSession();
    }
    
    playAmbientSound() {
        // Simulated ambient sound (in production, use actual audio files)
        console.log(`Playing ${this.currentAudio} ambient sound`);
        // Note: For demo, we're not including actual audio files
        // You can add Web Audio API or HTML5 Audio here
    }
    
    stopAmbientSound() {
        console.log('Stopping ambient sound');
    }
    
    playCompletionSound() {
        // Gentle chime for completion
        console.log('Session complete!');
    }
    
    saveSession() {
        const session = {
            date: new Date().toISOString(),
            duration: this.duration / 60,
            audio: this.currentAudio,
            completed: true
        };
        
        // Save to localStorage
        const sessions = JSON.parse(localStorage.getItem('meditationSessions') || '[]');
        sessions.push(session);
        localStorage.setItem('meditationSessions', JSON.stringify(sessions));
    }
}

// ==================== Breathing Exercise ====================
class BreathingExercise {
    constructor() {
        this.currentTechnique = 'box';
        this.isRunning = false;
        this.isPaused = false;
        this.currentPhase = 'ready';
        this.cycleCount = 0;
        this.sessionStartTime = null;
        this.phaseTimeout = null;
        
        this.techniques = {
            box: {
                name: 'Box Breathing',
                pattern: [
                    { phase: 'inhale', duration: 4 },
                    { phase: 'hold', duration: 4 },
                    { phase: 'exhale', duration: 4 },
                    { phase: 'hold', duration: 4 }
                ],
                instructions: {
                    inhale: 'Breathe in through your nose...',
                    hold: 'Hold your breath...',
                    exhale: 'Breathe out slowly...'
                }
            },
            relax: {
                name: '4-7-8 Relax',
                pattern: [
                    { phase: 'inhale', duration: 4 },
                    { phase: 'hold', duration: 7 },
                    { phase: 'exhale', duration: 8 }
                ],
                instructions: {
                    inhale: 'Breathe in quietly through your nose...',
                    hold: 'Hold your breath...',
                    exhale: 'Exhale completely through your mouth...'
                }
            },
            stress: {
                name: 'Stress Relief',
                pattern: [
                    { phase: 'inhale', duration: 4 },
                    { phase: 'hold', duration: 6 },
                    { phase: 'exhale', duration: 8 }
                ],
                instructions: {
                    inhale: 'Breathe in deeply...',
                    hold: 'Hold gently...',
                    exhale: 'Release all tension...'
                }
            },
            anxiety: {
                name: 'Anxiety Calm',
                pattern: [
                    { phase: 'inhale', duration: 5 },
                    { phase: 'hold', duration: 5 },
                    { phase: 'exhale', duration: 5 }
                ],
                instructions: {
                    inhale: 'Breathe in calm...',
                    hold: 'Feel the peace...',
                    exhale: 'Release anxiety...'
                }
            }
        };
        
        // DOM Elements
        this.breathingCircle = document.getElementById('breathingCircle');
        this.phaseText = document.getElementById('phaseText');
        this.breathingInstructions = document.getElementById('breathingInstructions');
        this.cyclesCountEl = document.getElementById('cyclesCount');
        this.sessionTimeEl = document.getElementById('sessionTime');
        this.startBtn = document.getElementById('startBreathingBtn');
        this.pauseBtn = document.getElementById('pauseBreathingBtn');
        this.resetBtn = document.getElementById('resetBreathingBtn');
        
        this.init();
    }
    
    init() {
        // Technique selection
        document.querySelectorAll('.technique-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const technique = e.currentTarget.dataset.technique;
                this.selectTechnique(technique);
            });
        });
        
        // Controls
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
    }
    
    selectTechnique(technique) {
        if (this.isRunning) return;
        
        this.currentTechnique = technique;
        document.querySelectorAll('.technique-card').forEach(c => c.classList.remove('active'));
        document.querySelector(`[data-technique="${technique}"]`).classList.add('active');
        
        this.breathingInstructions.textContent = `${this.techniques[technique].name} selected. Press Start to begin.`;
    }
    
    start() {
        if (this.isRunning && !this.isPaused) return;
        
        if (this.isPaused) {
            this.isPaused = false;
            this.runPhase();
        } else {
            this.isRunning = true;
            this.sessionStartTime = Date.now();
            this.cycleCount = 0;
            this.cyclesCountEl.textContent = '0';
            this.startSessionTimer();
            this.runPhase(0);
        }
        
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
    }
    
    runPhase(phaseIndex = 0) {
        if (!this.isRunning || this.isPaused) return;
        
        const technique = this.techniques[this.currentTechnique];
        const phase = technique.pattern[phaseIndex];
        
        this.currentPhase = phase.phase;
        this.updateAnimation(phase.phase);
        this.phaseText.textContent = phase.phase.toUpperCase();
        this.breathingInstructions.textContent = technique.instructions[phase.phase];
        
        // Check if completing a cycle
        if (phaseIndex === 0 && this.cycleCount > 0) {
            // New cycle starting
        } else if (phaseIndex === technique.pattern.length - 1) {
            // Last phase of cycle
            setTimeout(() => {
                if (this.isRunning && !this.isPaused) {
                    this.cycleCount++;
                    this.cyclesCountEl.textContent = this.cycleCount;
                }
            }, phase.duration * 1000);
        }
        
        this.phaseTimeout = setTimeout(() => {
            if (this.isRunning && !this.isPaused) {
                const nextIndex = (phaseIndex + 1) % technique.pattern.length;
                this.runPhase(nextIndex);
            }
        }, phase.duration * 1000);
    }
    
    updateAnimation(phase) {
        this.breathingCircle.className = 'breathing-circle';
        
        // Force reflow
        void this.breathingCircle.offsetWidth;
        
        if (phase === 'inhale') {
            this.breathingCircle.classList.add('inhale');
        } else if (phase === 'hold') {
            this.breathingCircle.classList.add('hold');
        } else if (phase === 'exhale') {
            this.breathingCircle.classList.add('exhale');
        }
    }
    
    startSessionTimer() {
        const timer = setInterval(() => {
            if (!this.isRunning) {
                clearInterval(timer);
                return;
            }
            
            if (this.isPaused) return;
            
            const elapsed = Math.floor((Date.now() - this.sessionStartTime) / 1000);
            const mins = Math.floor(elapsed / 60);
            const secs = elapsed % 60;
            this.sessionTimeEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }, 1000);
    }
    
    pause() {
        if (!this.isRunning || this.isPaused) return;
        
        this.isPaused = true;
        clearTimeout(this.phaseTimeout);
        this.phaseText.textContent = 'PAUSED';
        this.breathingInstructions.textContent = 'Take a rest, then press Resume';
        this.startBtn.disabled = false;
        this.startBtn.textContent = '▶ Resume';
        this.pauseBtn.disabled = true;
    }
    
    reset() {
        this.stop();
        this.currentPhase = 'ready';
        this.cycleCount = 0;
        this.cyclesCountEl.textContent = '0';
        this.sessionTimeEl.textContent = '00:00';
        this.phaseText.textContent = 'Ready';
        this.breathingCircle.className = 'breathing-circle';
        this.breathingInstructions.textContent = 'Select a technique and press Start';
        this.startBtn.textContent = '▶ Start';
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
    }
    
    stop() {
        this.isRunning = false;
        this.isPaused = false;
        clearTimeout(this.phaseTimeout);
    }
}

// ==================== Initialize App ====================
document.addEventListener('DOMContentLoaded', () => {
    window.meditationTimer = new MeditationTimer();
    window.breathingExercise = new BreathingExercise();
    
    console.log('Guidance Guru v0.0.1 initialized!');
});
