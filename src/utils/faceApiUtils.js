// Import necessary modules
import * as faceapi from 'face-api.js';

// Flag to track if the models are loaded
let modelsLoaded = false;

/**
 * Load the face-api.js models
 */
export const loadFaceAPI = async () => {
  if (modelsLoaded) return;
  
  try {
    console.log('Loading face-api.js models...');
    
    // Load models from CDN
    const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
    
    // Load required models for emotion detection
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ]);
    
    modelsLoaded = true;
    console.log('Face-api.js models loaded successfully');
  } catch (error) {
    console.error('Error loading face-api.js models:', error);
    throw error;
  }
};

/**
 * Detect emotions from a video element
 * @param {HTMLVideoElement} videoElement - The video element to detect emotions from
 * @returns {Array} Array of emotions sorted by confidence
 */
export const detectEmotions = async (videoElement) => {
  if (!modelsLoaded) {
    throw new Error('Face-api.js models not loaded');
  }
  
  try {
    // Detect faces with expressions
    const detections = await faceapi
      .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceExpressions();
    
    if (!detections || detections.length === 0) {
      return [];
    }
    
    // Get the first face (assume one person in the video)
    const face = detections[0];
    const expressions = face.expressions;
    
    // Convert expressions object to array and sort by confidence
    const emotionsArray = Object.entries(expressions).map(([emotion, confidence]) => ({
      emotion,
      confidence
    }));
    
    // Sort by confidence, highest first
    emotionsArray.sort((a, b) => b.confidence - a.confidence);
    
    return emotionsArray;
  } catch (error) {
    console.error('Error detecting emotions:', error);
    return [];
  }
};

/**
 * Get the dominant emotion from a video element
 * @param {HTMLVideoElement} videoElement - The video element to detect emotion from
 * @returns {String} The dominant emotion or null if no face detected
 */
export const getDominantEmotion = async (videoElement) => {
  const emotions = await detectEmotions(videoElement);
  
  if (emotions && emotions.length > 0) {
    return emotions[0].emotion;
  }
  
  return null;
};

/**
 * Check if a face is present in the video
 * @param {HTMLVideoElement} videoElement - The video element to check
 * @returns {Boolean} True if a face is detected, false otherwise
 */
export const isFacePresent = async (videoElement) => {
  if (!modelsLoaded) {
    throw new Error('Face-api.js models not loaded');
  }
  
  try {
    const detections = await faceapi
      .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions());
    
    return detections && detections.length > 0;
  } catch (error) {
    console.error('Error checking for face:', error);
    return false;
  }
};
