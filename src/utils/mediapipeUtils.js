// Functions for working with MediaPipe Face Mesh

/**
 * Load the MediaPipe Face Mesh model
 * @returns {Promise<any>} The loaded Face Mesh model
 */
export const loadFaceMesh = async () => {
  try {
    // Import MediaPipe dynamically to avoid SSR issues
    const { FaceMesh } = await import('@mediapipe/face_mesh');
    
    // Create a new Face Mesh instance
    const faceMesh = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      }
    });
    
    // Configure the Face Mesh
    await faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    
    console.log('MediaPipe Face Mesh loaded successfully');
    return faceMesh;
  } catch (error) {
    console.error('Error loading MediaPipe Face Mesh:', error);
    throw error;
  }
};

/**
 * Detect face landmarks using MediaPipe Face Mesh
 * @param {FaceMesh} faceMesh - The Face Mesh model
 * @param {HTMLVideoElement} videoElement - The video element to detect landmarks from
 * @returns {Object} Object containing face mesh landmarks and eye landmarks
 */
export const detectFaceLandmarks = async (faceMesh, videoElement) => {
  if (!faceMesh || !videoElement) return null;
  
  try {
    // Create a canvas element to capture a video frame
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    // Get the image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Process the image with Face Mesh
    const results = await new Promise((resolve) => {
      faceMesh.onResults((results) => {
        resolve(results);
      });
      
      faceMesh.send({ image: canvas });
    });
    
    // If no face is detected, return null
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      return null;
    }
    
    // Get the face landmarks
    const faceLandmarks = results.multiFaceLandmarks[0];
    
    // Extract eye landmarks
    const leftEyeLandmarks = extractEyeLandmarks(faceLandmarks, 'left', canvas.width, canvas.height);
    const rightEyeLandmarks = extractEyeLandmarks(faceLandmarks, 'right', canvas.width, canvas.height);
    
    // Estimate gaze direction (simplified)
    const gazeDirection = estimateGazeDirection(leftEyeLandmarks, rightEyeLandmarks);
    
    // Convert the landmarks to a format that's easier to use for rendering
    const normalizedLandmarks = faceLandmarks.map(point => ({
      x: point.x * canvas.width,
      y: point.y * canvas.height,
      z: point.z
    }));
    
    return {
      faceMesh: normalizedLandmarks,
      eyes: {
        leftEye: leftEyeLandmarks,
        rightEye: rightEyeLandmarks,
        // Estimate left and right pupils
        leftPupil: estimatePupilPosition(leftEyeLandmarks),
        rightPupil: estimatePupilPosition(rightEyeLandmarks),
        // Gaze direction vector
        gazeDirection: gazeDirection
      }
    };
  } catch (error) {
    console.error('Error detecting face landmarks:', error);
    return null;
  }
};

/**
 * Extract eye landmarks from the face landmarks
 * @param {Array} faceLandmarks - The face landmarks from MediaPipe
 * @param {String} eye - The eye to extract ('left' or 'right')
 * @param {Number} width - The width of the video
 * @param {Number} height - The height of the video
 * @returns {Array} Array of eye landmark points
 */
const extractEyeLandmarks = (faceLandmarks, eye, width, height) => {
  // MediaPipe face mesh indices for the eye contours
  // These are the indices of the landmarks that make up the eye
  const leftEyeIndices = [133, 173, 157, 158, 159, 160, 161, 246, 33, 7, 163, 144, 145, 153, 154, 155];
  const rightEyeIndices = [362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381, 382];
  
  const indices = eye === 'left' ? leftEyeIndices : rightEyeIndices;
  
  return indices.map(index => {
    const point = faceLandmarks[index];
    return {
      x: point.x * width,
      y: point.y * height,
      z: point.z
    };
  });
};

/**
 * Estimate the pupil position from eye landmarks
 * @param {Array} eyeLandmarks - The eye landmarks
 * @returns {Object} The estimated pupil position {x, y}
 */
const estimatePupilPosition = (eyeLandmarks) => {
  if (!eyeLandmarks || eyeLandmarks.length === 0) return null;
  
  // Calculate the center of the eye as an estimate for the pupil
  const sumX = eyeLandmarks.reduce((sum, point) => sum + point.x, 0);
  const sumY = eyeLandmarks.reduce((sum, point) => sum + point.y, 0);
  
  return {
    x: sumX / eyeLandmarks.length,
    y: sumY / eyeLandmarks.length
  };
};

/**
 * Estimate gaze direction from eye landmarks
 * @param {Array} leftEyeLandmarks - The left eye landmarks
 * @param {Array} rightEyeLandmarks - The right eye landmarks
 * @returns {Object} The estimated gaze direction vector {x, y, z}
 */
const estimateGazeDirection = (leftEyeLandmarks, rightEyeLandmarks) => {
  if (!leftEyeLandmarks || !rightEyeLandmarks) return { x: 0, y: 0, z: 0 };
  
  // Get the pupils
  const leftPupil = estimatePupilPosition(leftEyeLandmarks);
  const rightPupil = estimatePupilPosition(rightEyeLandmarks);
  
  if (!leftPupil || !rightPupil) return { x: 0, y: 0, z: 0 };
  
  // Get the eye centers
  const leftEyeCenter = {
    x: leftEyeLandmarks.reduce((sum, p) => sum + p.x, 0) / leftEyeLandmarks.length,
    y: leftEyeLandmarks.reduce((sum, p) => sum + p.y, 0) / leftEyeLandmarks.length
  };
  
  const rightEyeCenter = {
    x: rightEyeLandmarks.reduce((sum, p) => sum + p.x, 0) / rightEyeLandmarks.length,
    y: rightEyeLandmarks.reduce((sum, p) => sum + p.y, 0) / rightEyeLandmarks.length
  };
  
  // Calculate the vector from eye center to pupil for both eyes
  const leftGaze = {
    x: leftPupil.x - leftEyeCenter.x,
    y: leftPupil.y - leftEyeCenter.y
  };
  
  const rightGaze = {
    x: rightPupil.x - rightEyeCenter.x,
    y: rightPupil.y - rightEyeCenter.y
  };
  
  // Average the two gaze vectors and normalize
  const avgX = (leftGaze.x + rightGaze.x) / 2;
  const avgY = (leftGaze.y + rightGaze.y) / 2;
  
  // Normalize the vector
  const magnitude = Math.sqrt(avgX * avgX + avgY * avgY);
  
  if (magnitude === 0) return { x: 0, y: 0, z: 0 };
  
  return {
    x: avgX / magnitude,
    y: avgY / magnitude,
    z: 0 // We can't really estimate Z from 2D landmarks
  };
};
