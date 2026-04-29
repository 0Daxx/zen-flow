// Emotion Detection Module using face-api.js

let modelsLoaded = false;
let detectionInterval = null;
let videoElement = null;
let isDetecting = false;

/**
 * Load face-api.js models
 */
export async function loadModels() {
  if (modelsLoaded) return true;
  
  try {
    const modelPath = chrome.runtime.getURL('assets/models/face-api.models');
    
    // Load all required models
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
      faceapi.nets.faceLandmark68Net.loadFromUri(modelPath),
      faceapi.nets.faceExpressionNet.loadFromUri(modelPath)
    ]);
    
    modelsLoaded = true;
    console.log('Face-api.js models loaded successfully');
    return true;
  } catch (error) {
    console.error('Failed to load face-api.js models:', error);
    return false;
  }
}

/**
 * Initialize webcam stream
 */
export async function initWebcam() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 320 },
        height: { ideal: 240 },
        facingMode: 'user'
      },
      audio: false
    });
    
    videoElement = document.createElement('video');
    videoElement.srcObject = stream;
    videoElement.play();
    
    // Wait for video to be ready
    await new Promise((resolve) => {
      videoElement.onloadeddata = resolve;
    });
    
    return true;
  } catch (error) {
    console.error('Failed to initialize webcam:', error);
    return false;
  }
}

/**
 * Stop webcam stream
 */
export function stopWebcam() {
  if (videoElement && videoElement.srcObject) {
    const tracks = videoElement.srcObject.getTracks();
    tracks.forEach(track => track.stop());
    videoElement = null;
  }
}

/**
 * Detect emotion from current video frame
 */
export async function detectEmotion() {
  if (!videoElement || !modelsLoaded) {
    return null;
  }
  
  try {
    isDetecting = true;
    
    const detections = await faceapi
      .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();
    
    isDetecting = false;
    
    if (!detections) {
      return {
        emotion: 'neutral',
        confidence: 0,
        expressions: {}
      };
    }
    
    const expressions = detections.expressions;
    const dominantEmotion = getDominantEmotion(expressions);
    
    return {
      emotion: dominantEmotion.emotion,
      confidence: dominantEmotion.confidence,
      expressions: expressions,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Emotion detection error:', error);
    isDetecting = false;
    return null;
  }
}

/**
 * Get dominant emotion from expression scores
 */
function getDominantEmotion(expressions) {
  const emotionMap = {
    neutral: expressions.neutral || 0,
    happy: expressions.happy || 0,
    sad: expressions.sad || 0,
    angry: expressions.angry || 0,
    fearful: expressions.fearful || 0,
    disgusted: expressions.disgusted || 0,
    surprised: expressions.surprised || 0
  };
  
  // Check for stress indicators (combination of emotions)
  const stressScore = (expressions.angry || 0) * 0.4 + 
                      (expressions.fearful || 0) * 0.4 + 
                      (expressions.sad || 0) * 0.2;
  
  let dominant = { emotion: 'neutral', confidence: 0 };
  
  for (const [emotion, score] of Object.entries(emotionMap)) {
    if (score > dominant.confidence) {
      dominant = { emotion, confidence: score };
    }
  }
  
  // Override with stressed if stress score is high
  if (stressScore > 0.5 && stressScore > dominant.confidence) {
    dominant = { emotion: 'stressed', confidence: stressScore };
  }
  
  return dominant;
}

/**
 * Start periodic emotion detection
 */
export function startEmotionDetection(intervalMs = 30000, callback) {
  if (detectionInterval) {
    stopEmotionDetection();
  }
  
  detectionInterval = setInterval(async () => {
    if (!isDetecting) {
      const result = await detectEmotion();
      if (result && callback) {
        callback(result);
      }
    }
  }, intervalMs);
  
  console.log(`Emotion detection started with ${intervalMs}ms interval`);
}

/**
 * Stop periodic emotion detection
 */
export function stopEmotionDetection() {
  if (detectionInterval) {
    clearInterval(detectionInterval);
    detectionInterval = null;
    console.log('Emotion detection stopped');
  }
}

/**
 * Check if models are loaded
 */
export function areModelsLoaded() {
  return modelsLoaded;
}

/**
 * Check if currently detecting
 */
export function isCurrentlyDetecting() {
  return isDetecting;
}

// Make faceapi available globally for this module
if (typeof faceapi === 'undefined') {
  console.warn('faceapi not found. Ensure face-api.js is loaded.');
}
