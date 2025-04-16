/**
 * MediaPipe Utils
 * Handles face mesh detection and detailed face landmarks
 */

class MediaPipeManager {
  constructor() {
    this.faceMesh = null;
    this.isInitialized = false;
    this.videoElement = null;
    this.onFaceMeshResults = null;
    this.onEyeTrackingResults = null;
  }

  /**
   * Initialize MediaPipe FaceMesh
   */
  async initialize() {
    if (this.isInitialized) return true;

    try {
      this.faceMesh = new FaceMesh({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }
      });

      // Configure the options for FaceMesh
      this.faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      
      // Set up the callback
      this.faceMesh.onResults((results) => this.processResults(results));
      
      this.isInitialized = true;
      console.log('MediaPipe FaceMesh initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing MediaPipe FaceMesh:', error);
      return false;
    }
  }

  /**
   * Start tracking on a video element
   */
  startTracking(videoElement) {
    if (!this.isInitialized) {
      console.error('MediaPipe not initialized. Call initialize() first.');
      return false;
    }

    this.videoElement = videoElement;
    
    // Create a frame callback function for processing each frame
    const onFrame = async () => {
      if (!videoElement.paused && !videoElement.ended && videoElement.videoWidth > 0) {
        await this.faceMesh.send({ image: videoElement });
      }
      
      // Continue processing frames
      if (this.videoElement === videoElement) {
        requestAnimationFrame(onFrame);
      }
    };
    
    // Start processing frames
    requestAnimationFrame(onFrame);
    return true;
  }

  /**
   * Stop tracking
   */
  stopTracking() {
    this.videoElement = null;
  }

  /**
   * Process results from FaceMesh
   */
  processResults(results) {
    if (this.onFaceMeshResults) {
      this.onFaceMeshResults(results);
    }
    
    // Extract eye tracking data if needed
    if (this.onEyeTrackingResults && results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];
      const eyeData = this.extractEyeData(landmarks);
      this.onEyeTrackingResults(eyeData);
    } else if (this.onEyeTrackingResults) {
      this.onEyeTrackingResults(null);
    }
  }

  /**
   * Extract eye tracking data from face landmarks
   */
  extractEyeData(landmarks) {
    if (!landmarks) return null;
    
    // MediaPipe FaceMesh indices for eyes
    // Left eye indices: 33, 133, 160, 159, 158, 144, 145, 153
    // Right eye indices: 362, 263, 386, 385, 384, 373, 374, 380
    const leftEyeIndices = [33, 133, 160, 159, 158, 144, 145, 153];
    const rightEyeIndices = [362, 263, 386, 385, 384, 373, 374, 380];
    
    const leftEyePoints = leftEyeIndices.map(index => landmarks[index]);
    const rightEyePoints = rightEyeIndices.map(index => landmarks[index]);
    
    // Calculate eye centers
    const leftEyeCenter = this.calculateCentroid(leftEyePoints);
    const rightEyeCenter = this.calculateCentroid(rightEyePoints);
    
    // Iris indices (available if refineLandmarks is true)
    // Left iris: 468-472
    // Right iris: 473-477
    const leftIrisIndices = [468, 469, 470, 471, 472];
    const rightIrisIndices = [473, 474, 475, 476, 477];
    
    let leftIrisCenter = null;
    let rightIrisCenter = null;
    
    // Only calculate iris centers if they exist in the landmarks
    if (landmarks.length > 478) {
      const leftIrisPoints = leftIrisIndices.map(index => landmarks[index]);
      const rightIrisPoints = rightIrisIndices.map(index => landmarks[index]);
      
      leftIrisCenter = this.calculateCentroid(leftIrisPoints);
      rightIrisCenter = this.calculateCentroid(rightIrisPoints);
    }
    
    // Calculate eye openness (normalized vertical distance)
    const leftEyeOpenness = this.calculateEyeOpenness(leftEyePoints);
    const rightEyeOpenness = this.calculateEyeOpenness(rightEyePoints);
    
    // Estimate gaze direction if iris data is available
    let gazeDirection = null;
    if (leftIrisCenter && rightIrisCenter) {
      gazeDirection = this.estimateGazeDirection(
        leftEyeCenter, leftIrisCenter,
        rightEyeCenter, rightIrisCenter
      );
    }
    
    return {
      leftEye: {
        center: leftEyeCenter,
        iris: leftIrisCenter,
        openness: leftEyeOpenness,
        points: leftEyePoints
      },
      rightEye: {
        center: rightEyeCenter,
        iris: rightIrisCenter,
        openness: rightEyeOpenness,
        points: rightEyePoints
      },
      gazeDirection: gazeDirection
    };
  }

  /**
   * Calculate centroid (average position) of 3D points
   */
  calculateCentroid(points) {
    if (!points || points.length === 0) return null;
    
    const sum = points.reduce((acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y,
      z: acc.z + point.z
    }), { x: 0, y: 0, z: 0 });
    
    return {
      x: sum.x / points.length,
      y: sum.y / points.length,
      z: sum.z / points.length
    };
  }

  /**
   * Calculate eye openness (normalized vertical distance between top and bottom eyelids)
   */
  calculateEyeOpenness(eyePoints) {
    if (!eyePoints || eyePoints.length < 8) return 0;
    
    // Use vertical points to measure eye openness
    const topLid = eyePoints[1]; // Upper eyelid
    const bottomLid = eyePoints[5]; // Lower eyelid
    
    // Calculate vertical distance
    const distance = Math.abs(topLid.y - bottomLid.y);
    
    // Normalize - typical open eye has distance ~0.02-0.03 in normalized coordinates
    // Values around 0.01 or less indicate closed eyes
    return distance / 0.03;
  }

  /**
   * Estimate gaze direction from eye and iris centers
   */
  estimateGazeDirection(leftEyeCenter, leftIrisCenter, rightEyeCenter, rightIrisCenter) {
    // Calculate vector from eye center to iris center for both eyes
    const leftEyeVector = {
      x: leftIrisCenter.x - leftEyeCenter.x,
      y: leftIrisCenter.y - leftEyeCenter.y,
      z: leftIrisCenter.z - leftEyeCenter.z
    };
    
    const rightEyeVector = {
      x: rightIrisCenter.x - rightEyeCenter.x,
      y: rightIrisCenter.y - rightEyeCenter.y,
      z: rightIrisCenter.z - rightEyeCenter.z
    };
    
    // Average the vectors
    const gazeVector = {
      x: (leftEyeVector.x + rightEyeVector.x) / 2,
      y: (leftEyeVector.y + rightEyeVector.y) / 2,
      z: (leftEyeVector.z + rightEyeVector.z) / 2
    };
    
    // Normalize the vector
    const magnitude = Math.sqrt(
      gazeVector.x * gazeVector.x + 
      gazeVector.y * gazeVector.y + 
      gazeVector.z * gazeVector.z
    );
    
    if (magnitude > 0) {
      gazeVector.x /= magnitude;
      gazeVector.y /= magnitude;
      gazeVector.z /= magnitude;
    }
    
    return gazeVector;
  }
}

// Export a singleton instance
const mediaPipeManager = new MediaPipeManager();