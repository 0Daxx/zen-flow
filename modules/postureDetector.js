// Posture Detection Module using PoseNet

let modelsLoaded = false;
let detectionInterval = null;
let videoElement = null;
let net = null;
let isDetecting = false;
let currentPostureScore = 100;

/**
 * Load PoseNet model
 */
export async function loadModels() {
  if (modelsLoaded && net) return true;
  
  try {
    // Load PoseNet model
    net = await posenet.load({
      architecture: 'MobileNetV1',
      outputStride: 16,
      inputResolution: { width: 257, height: 200 },
      multiplier: 0.75
    });
    
    modelsLoaded = true;
    console.log('PoseNet model loaded successfully');
    return true;
  } catch (error) {
    console.error('Failed to load PoseNet model:', error);
    return false;
  }
}

/**
 * Initialize webcam stream for posture detection
 */
export async function initWebcam() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
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
    console.error('Failed to initialize webcam for posture:', error);
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
 * Detect posture and calculate score
 */
export async function detectPosture() {
  if (!videoElement || !net) {
    return null;
  }
  
  try {
    isDetecting = true;
    
    const pose = await net.estimateSinglePose(videoElement, {
      flipHorizontal: false
    });
    
    isDetecting = false;
    
    if (!pose || !pose.keypoints || pose.score < 0.3) {
      return {
        score: currentPostureScore,
        keypoints: {},
        issues: []
      };
    }
    
    const keypoints = pose.keypoints;
    const issues = analyzePosture(keypoints);
    const score = calculatePostureScore(issues);
    currentPostureScore = score;
    
    return {
      score: score,
      keypoints: keypoints,
      issues: issues,
      confidence: pose.score,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Posture detection error:', error);
    isDetecting = false;
    return {
      score: currentPostureScore,
      keypoints: {},
      issues: []
    };
  }
}

/**
 * Analyze posture for common issues
 */
function analyzePosture(keypoints) {
  const issues = [];
  
  // Get key points
  const nose = keypoints.find(k => k.part === 'nose');
  const leftEye = keypoints.find(k => k.part === 'leftEye');
  const rightEye = keypoints.find(k => k.part === 'rightEye');
  const leftShoulder = keypoints.find(k => k.part === 'leftShoulder');
  const rightShoulder = keypoints.find(k => k.part === 'rightShoulder');
  const leftHip = keypoints.find(k => k.part === 'leftHip');
  const rightHip = keypoints.find(k => k.part === 'rightHip');
  
  // Check head forward tilt (text neck)
  if (nose && leftShoulder && rightShoulder) {
    const shoulderCenterX = (leftShoulder.position.x + rightShoulder.position.x) / 2;
    const headForwardOffset = Math.abs(nose.position.x - shoulderCenterX);
    
    if (headForwardOffset > 30) {
      issues.push({
        type: 'head_forward_tilt',
        severity: Math.min(headForwardOffset / 30, 2),
        message: 'Head is tilted too far forward'
      });
    }
  }
  
  // Check shoulder asymmetry
  if (leftShoulder && rightShoulder) {
    const shoulderDiff = Math.abs(leftShoulder.position.y - rightShoulder.position.y);
    
    if (shoulderDiff > 15) {
      issues.push({
        type: 'shoulder_asymmetry',
        severity: Math.min(shoulderDiff / 15, 1.5),
        message: 'Shoulders are uneven'
      });
    }
  }
  
  // Check spine alignment (using hips and shoulders)
  if (leftShoulder && rightShoulder && leftHip && rightHip) {
    const shoulderCenterX = (leftShoulder.position.x + rightShoulder.position.x) / 2;
    const hipCenterX = (leftHip.position.x + rightHip.position.x) / 2;
    const spineDeviation = Math.abs(shoulderCenterX - hipCenterX);
    
    if (spineDeviation > 20) {
      issues.push({
        type: 'spine_deviation',
        severity: Math.min(spineDeviation / 20, 1),
        message: 'Spine is misaligned'
      });
    }
  }
  
  // Check hip-seat alignment
  if (leftHip && rightHip) {
    const hipDiff = Math.abs(leftHip.position.y - rightHip.position.y);
    
    if (hipDiff > 20) {
      issues.push({
        type: 'hip_misalignment',
        severity: Math.min(hipDiff / 20, 1),
        message: 'Hips are uneven - check seating position'
      });
    }
  }
  
  return issues;
}

/**
 * Calculate posture score based on issues
 */
function calculatePostureScore(issues) {
  let score = 100;
  
  for (const issue of issues) {
    switch (issue.type) {
      case 'head_forward_tilt':
        score -= issue.severity * 30; // Max -60 points
        break;
      case 'shoulder_asymmetry':
        score -= issue.severity * 15; // Max -22.5 points
        break;
      case 'spine_deviation':
      case 'hip_misalignment':
        score -= issue.severity * 20; // Max -20 points
        break;
    }
  }
  
  return Math.max(0, Math.round(score));
}

/**
 * Start periodic posture detection
 */
export function startPostureDetection(intervalMs = 200, callback) {
  if (detectionInterval) {
    stopPostureDetection();
  }
  
  detectionInterval = setInterval(async () => {
    if (!isDetecting) {
      const result = await detectPosture();
      if (result && callback) {
        callback(result);
      }
    }
  }, intervalMs);
  
  console.log(`Posture detection started with ${intervalMs}ms interval`);
}

/**
 * Stop periodic posture detection
 */
export function stopPostureDetection() {
  if (detectionInterval) {
    clearInterval(detectionInterval);
    detectionInterval = null;
    console.log('Posture detection stopped');
  }
}

/**
 * Get current posture score
 */
export function getCurrentPostureScore() {
  return currentPostureScore;
}

/**
 * Check if models are loaded
 */
export function areModelsLoaded() {
  return modelsLoaded && net !== null;
}

/**
 * Check if currently detecting
 */
export function isCurrentlyDetecting() {
  return isDetecting;
}

// Make posenet available globally for this module
if (typeof posenet === 'undefined') {
  console.warn('posenet not found. Ensure PoseNet library is loaded.');
}
