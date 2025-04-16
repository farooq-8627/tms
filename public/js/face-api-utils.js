/**
 * Face API Utils
 * Handles face detection, emotion recognition, and face landmarks
 */

class FaceAPIManager {
  constructor() {
    this.isInitialized = false;
    this.detectionInterval = null;
    this.detectionFrequency = 500; // ms between detections
    this.options = {
      inputSize: 224,
      scoreThreshold: 0.5
    };
    this.onFaceDetected = null;
    this.onEmotionDetected = null;
  }

  /**
   * Load all required face-api.js models
   */
  async loadModels() {
    if (this.isInitialized) return true;
    
    try {
      // Load face-api.js models from CDN
      await faceapi.loadSsdMobilenetv1Model('/models');
      await faceapi.loadFaceLandmarkModel('/models');
      await faceapi.loadFaceExpressionModel('/models');
      
      console.log('Face-api models loaded successfully');
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error loading face-api models:', error);
      return false;
    }
  }

  /**
   * Start continuous face detection on a video element
   */
  startFaceDetection(videoElement, intervalMs = 500) {
    if (!this.isInitialized) {
      console.error('Face API not initialized. Call loadModels() first.');
      return false;
    }
    
    this.detectionFrequency = intervalMs;
    
    // Stop any existing detection
    this.stopFaceDetection();
    
    // Start new detection interval
    this.detectionInterval = setInterval(async () => {
      if (videoElement.paused || videoElement.ended || !videoElement.videoWidth) {
        return;
      }
      
      // Detect faces with expressions and landmarks
      const detections = await faceapi
        .detectAllFaces(videoElement, new faceapi.SsdMobilenetv1Options(this.options))
        .withFaceLandmarks()
        .withFaceExpressions();
      
      if (detections.length > 0) {
        const detection = detections[0]; // Use the first face
        
        // Process face detection
        if (this.onFaceDetected) {
          this.onFaceDetected(detection);
        }
        
        // Process emotions
        if (this.onEmotionDetected && detection.expressions) {
          const emotions = this.processEmotions(detection.expressions);
          this.onEmotionDetected(emotions);
        }
        
        // Process eye positions if landmarks available
        if (detection.landmarks) {
          const eyePositions = this.getEyePositions(detection.landmarks);
          
          // You could add a callback for eye positions here if needed
        }
      } else {
        // No face detected
        if (this.onEmotionDetected) {
          this.onEmotionDetected({ dominant: 'scanning', emotions: [] });
        }
      }
    }, this.detectionFrequency);
    
    return true;
  }

  /**
   * Stop face detection
   */
  stopFaceDetection() {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }
  }

  /**
   * Process emotions to get sorted list of emotions with confidence scores
   */
  processEmotions(expressions) {
    const emotions = Object.keys(expressions).map(emotion => ({
      emotion,
      score: expressions[emotion]
    }));
    
    // Sort by score in descending order
    emotions.sort((a, b) => b.score - a.score);
    
    // Get the dominant emotion
    const dominant = emotions[0].emotion;
    
    return {
      dominant,
      emotions
    };
  }

  /**
   * Get eye positions from landmarks
   */
  getEyePositions(landmarks) {
    const leftEyePoints = landmarks.getLeftEye();
    const rightEyePoints = landmarks.getRightEye();
    
    const leftEyeCenter = this.calculateCentroid(leftEyePoints);
    const rightEyeCenter = this.calculateCentroid(rightEyePoints);
    
    const gazeDirection = this.estimateGazeDirection(leftEyeCenter, rightEyeCenter);
    
    return {
      leftEye: leftEyeCenter,
      rightEye: rightEyeCenter,
      gazeDirection
    };
  }

  /**
   * Calculate centroid (average position) of points
   */
  calculateCentroid(points) {
    if (!points || points.length === 0) return null;
    
    const sum = points.reduce((acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y
    }), { x: 0, y: 0 });
    
    return {
      x: sum.x / points.length,
      y: sum.y / points.length
    };
  }

  /**
   * Estimate gaze direction from eye landmarks
   */
  estimateGazeDirection(leftEye, rightEye) {
    // This is a very simplified gaze estimation
    // In a real implementation, you would use much more sophisticated techniques
    // that consider iris position relative to eye corners
    
    // For now, just give a horizontal guess based on face rotation
    // by checking if eyes are horizontally aligned
    const eyeSlope = (rightEye.y - leftEye.y) / (rightEye.x - leftEye.x);
    
    return {
      x: Math.min(1, Math.max(-1, eyeSlope * 5)), // Scale up for visibility, clamp to -1 to 1
      y: 0, // We don't have good data for vertical direction in this simplified approach
      z: 0
    };
  }
}

// Export a singleton instance
const faceAPIManager = new FaceAPIManager();