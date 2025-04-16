/**
 * AI-Powered Biometric Analysis
 * Enhanced biometric processing using OpenAI Vision API
 */

class AIBiometricsManager {
  constructor(socket) {
    this.socket = socket;
    this.sessionId = null;
    this.isProcessing = false;
    this.setupSocketListeners();
  }

  /**
   * Set up socket event listeners for AI analysis results
   */
  setupSocketListeners() {
    // Emotion analysis results
    this.socket.on('emotion-analysis-result', (data) => {
      console.log('Received emotion analysis:', data);
      if (this.onEmotionAnalysis) {
        this.onEmotionAnalysis(data);
      }
      this.isProcessing = false;
    });

    // Eye tracking/gaze analysis results
    this.socket.on('gaze-analysis-result', (data) => {
      console.log('Received gaze analysis:', data);
      if (this.onGazeAnalysis) {
        this.onGazeAnalysis(data);
      }
      this.isProcessing = false;
    });

    // Comprehensive biometric analysis results
    this.socket.on('biometric-analysis-result', (data) => {
      console.log('Received biometric analysis:', data);
      if (this.onBiometricAnalysis) {
        this.onBiometricAnalysis(data);
      }
      this.isProcessing = false;
    });

    // Handle errors
    this.socket.on('emotion-analysis-error', (error) => {
      console.error('Emotion analysis error:', error);
      this.isProcessing = false;
    });

    this.socket.on('gaze-analysis-error', (error) => {
      console.error('Gaze analysis error:', error);
      this.isProcessing = false;
    });

    this.socket.on('biometric-analysis-error', (error) => {
      console.error('Biometric analysis error:', error);
      this.isProcessing = false;
    });
  }

  /**
   * Set the current biometric session ID for data storage
   * @param {number} id - The session ID
   */
  setSessionId(id) {
    this.sessionId = id;
    console.log(`Set biometric session ID to ${id}`);
  }

  /**
   * Create a new biometric session
   * @param {Object} sessionData - Session data (userId, roomId, description, metadata)
   * @returns {Promise<Object>} The created session object
   */
  async createSession(sessionData) {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const session = await response.json();
      this.setSessionId(session.id);
      return session;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }

  /**
   * Analyze emotions in a video frame
   * @param {HTMLVideoElement|HTMLCanvasElement} videoOrCanvas - The video or canvas element to capture
   * @param {boolean} useAI - Whether to use AI-powered analysis (true) or local processing (false)
   */
  analyzeEmotion(videoOrCanvas, useAI = true) {
    if (this.isProcessing) return;
    this.isProcessing = true;

    // Capture the current frame
    const canvas = videoOrCanvas instanceof HTMLCanvasElement 
      ? videoOrCanvas 
      : this.captureFrame(videoOrCanvas);
    
    // Get base64 image data
    const imageData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

    if (useAI) {
      // Send to server for AI analysis
      this.socket.emit('analyze-emotion', {
        image: imageData,
        sessionId: this.sessionId
      });
    } else {
      // Use local face-api.js processing
      // Implementation depends on face-api.js being properly set up
      this.isProcessing = false;
    }
  }

  /**
   * Analyze gaze and eye tracking in a video frame
   * @param {HTMLVideoElement|HTMLCanvasElement} videoOrCanvas - The video or canvas element to capture
   * @param {boolean} useAI - Whether to use AI-powered analysis (true) or local processing (false)
   */
  analyzeGaze(videoOrCanvas, useAI = true) {
    if (this.isProcessing) return;
    this.isProcessing = true;

    // Capture the current frame
    const canvas = videoOrCanvas instanceof HTMLCanvasElement 
      ? videoOrCanvas 
      : this.captureFrame(videoOrCanvas);
    
    // Get base64 image data
    const imageData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

    if (useAI) {
      // Send to server for AI analysis
      this.socket.emit('analyze-gaze', {
        image: imageData,
        sessionId: this.sessionId
      });
    } else {
      // Use local MediaPipe processing
      // Implementation depends on MediaPipe being properly set up
      this.isProcessing = false;
    }
  }

  /**
   * Generate a comprehensive biometric analysis report
   * @param {HTMLVideoElement|HTMLCanvasElement} videoOrCanvas - The video or canvas element to capture
   * @param {Object} additionalData - Additional biometric data to include (heart rate, etc.)
   */
  generateBiometricReport(videoOrCanvas, additionalData = {}) {
    if (this.isProcessing) return;
    this.isProcessing = true;

    // Capture the current frame
    const canvas = videoOrCanvas instanceof HTMLCanvasElement 
      ? videoOrCanvas 
      : this.captureFrame(videoOrCanvas);
    
    // Get base64 image data
    const imageData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

    // Send to server for AI analysis
    this.socket.emit('analyze-biometrics', {
      image: imageData,
      biometricData: additionalData,
      sessionId: this.sessionId
    });
  }

  /**
   * Capture a frame from a video element
   * @param {HTMLVideoElement} videoElement - The video element to capture
   * @returns {HTMLCanvasElement} Canvas with the captured frame
   */
  captureFrame(videoElement) {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth || 640;
    canvas.height = videoElement.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  /**
   * Set callback for emotion analysis results
   * @param {Function} callback - The callback function
   */
  setEmotionAnalysisCallback(callback) {
    this.onEmotionAnalysis = callback;
  }

  /**
   * Set callback for gaze analysis results
   * @param {Function} callback - The callback function
   */
  setGazeAnalysisCallback(callback) {
    this.onGazeAnalysis = callback;
  }

  /**
   * Set callback for comprehensive biometric analysis results
   * @param {Function} callback - The callback function
   */
  setBiometricAnalysisCallback(callback) {
    this.onBiometricAnalysis = callback;
  }
}