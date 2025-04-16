/**
 * Attention Metrics Calculator
 * Analyzes eye tracking and face data to estimate attention levels
 */

class AttentionMetricsCalculator {
  constructor() {
    this.eyeTrackingData = [];
    this.maxDataPoints = 300; // ~10 seconds of data at 30fps
    this.lastBlink = 0;
    this.blinkCount = 0;
    this.fixations = [];
    this.saccades = [];
    this.attentionHistory = [];
    this.onAttentionUpdate = null;
  }

  /**
   * Add new eye tracking data point
   */
  addEyeTrackingData(eyeData) {
    if (!eyeData) return;
    
    const timestamp = Date.now();
    
    // Add timestamp to the data
    const dataPoint = {
      ...eyeData,
      timestamp
    };
    
    this.eyeTrackingData.push(dataPoint);
    
    // Keep buffer at a reasonable size
    if (this.eyeTrackingData.length > this.maxDataPoints) {
      this.eyeTrackingData.shift();
    }
    
    // Detect blinks
    this.detectBlink(dataPoint);
    
    // Identify fixations and saccades
    this.identifyFixationsAndSaccades();
    
    // Calculate attention metrics
    this.calculateAttentionMetrics();
  }

  /**
   * Detect eye blinks from eye openness data
   */
  detectBlink(dataPoint) {
    const timestamp = dataPoint.timestamp;
    const leftEyeOpenness = dataPoint.leftEye?.openness || 0;
    const rightEyeOpenness = dataPoint.rightEye?.openness || 0;
    
    // Average eye openness
    const avgOpenness = (leftEyeOpenness + rightEyeOpenness) / 2;
    
    // Threshold for blink detection
    const blinkThreshold = 0.2; // Eyes are considered closed below this value
    
    if (avgOpenness < blinkThreshold) {
      // Only count as a new blink if it's been at least 500ms since last blink
      if (timestamp - this.lastBlink > 500) {
        this.blinkCount++;
        this.lastBlink = timestamp;
      }
    }
  }

  /**
   * Identify fixations (when eyes are relatively stable) and saccades (rapid eye movements)
   */
  identifyFixationsAndSaccades() {
    if (this.eyeTrackingData.length < 3) return;
    
    // Look at the last 3 data points
    const recent = this.eyeTrackingData.slice(-3);
    
    // Calculate the movement between points
    const movements = [];
    for (let i = 1; i < recent.length; i++) {
      const prev = recent[i - 1];
      const curr = recent[i];
      
      if (prev.leftEye?.iris && curr.leftEye?.iris) {
        const distance = this.calculateDistance(prev.leftEye.iris, curr.leftEye.iris);
        movements.push(distance);
      }
    }
    
    // Calculate average movement
    const avgMovement = movements.reduce((sum, val) => sum + val, 0) / movements.length;
    
    // Threshold for saccade detection
    const saccadeThreshold = 0.01; // Adjust based on testing
    
    const latest = this.eyeTrackingData[this.eyeTrackingData.length - 1];
    
    if (avgMovement > saccadeThreshold) {
      // This is a saccade (rapid eye movement)
      this.saccades.push({
        timestamp: latest.timestamp,
        magnitude: avgMovement
      });
      
      // Keep saccades list manageable
      if (this.saccades.length > 20) {
        this.saccades.shift();
      }
    } else {
      // This is a fixation (eyes relatively stable)
      // Check if we should extend the last fixation or create a new one
      if (this.fixations.length > 0) {
        const lastFixation = this.fixations[this.fixations.length - 1];
        
        // If the last fixation was recent (within 100ms), extend it
        if (latest.timestamp - lastFixation.endTime < 100) {
          lastFixation.endTime = latest.timestamp;
          lastFixation.duration = lastFixation.endTime - lastFixation.startTime;
          
          // Add the position to calculate average
          if (latest.leftEye?.iris) {
            lastFixation.positions.push(latest.leftEye.iris);
          }
        } else {
          // Create a new fixation
          this.createNewFixation(latest);
        }
      } else {
        // Create the first fixation
        this.createNewFixation(latest);
      }
    }
  }

  /**
   * Create a new fixation entry
   */
  createNewFixation(dataPoint) {
    if (!dataPoint.leftEye?.iris) return;
    
    this.fixations.push({
      startTime: dataPoint.timestamp,
      endTime: dataPoint.timestamp,
      duration: 0,
      positions: [dataPoint.leftEye.iris]
    });
    
    // Keep fixations list manageable
    if (this.fixations.length > 20) {
      this.fixations.shift();
    }
  }

  /**
   * Calculate attention metrics based on eye movement patterns
   */
  calculateAttentionMetrics() {
    // Need enough data to calculate meaningful metrics
    if (this.eyeTrackingData.length < 30 || this.fixations.length < 2) return;
    
    // Get metrics from last 5 seconds (if available)
    const recentData = this.eyeTrackingData.filter(
      d => d.timestamp > Date.now() - 5000
    );
    
    // Calculate metrics
    
    // 1. Fixation count and average duration
    const recentFixations = this.fixations.filter(
      f => f.startTime > Date.now() - 5000
    );
    
    const fixationCount = recentFixations.length;
    
    let avgFixationDuration = 0;
    if (fixationCount > 0) {
      avgFixationDuration = recentFixations.reduce((sum, f) => sum + f.duration, 0) / fixationCount;
    }
    
    // 2. Saccade count
    const recentSaccades = this.saccades.filter(
      s => s.timestamp > Date.now() - 5000
    );
    
    const saccadeCount = recentSaccades.length;
    
    // 3. Blink rate (blinks per minute)
    const blinkRate = this.blinkCount * (60 / 5); // Convert 5 sec count to per minute
    
    // Calculate attention score
    // Higher scores for:
    // - Moderate fixation duration (not too short, not too long)
    // - Moderate saccade count (some eye movement, but not too much)
    // - Normal blink rate (neither too few nor too many)
    
    let attentionScore = this.calculateAttentionScore(
      fixationCount,
      avgFixationDuration,
      saccadeCount,
      blinkRate
    );
    
    // Add to history
    this.attentionHistory.push({
      timestamp: Date.now(),
      score: attentionScore
    });
    
    // Keep history manageable
    if (this.attentionHistory.length > 30) {
      this.attentionHistory.shift();
    }
    
    // Smooth the score by averaging recent values
    if (this.attentionHistory.length > 1) {
      const recentScores = this.attentionHistory.slice(-5);
      attentionScore = recentScores.reduce((sum, item) => sum + item.score, 0) / recentScores.length;
    }
    
    // Notify listeners
    if (this.onAttentionUpdate) {
      this.onAttentionUpdate({
        attentionScore: Math.round(attentionScore),
        fixationCount,
        avgFixationDuration,
        saccadeCount,
        blinkRate
      });
    }
  }

  /**
   * Calculate attention score based on eye metrics
   */
  calculateAttentionScore(fixationCount, avgFixationDuration, saccadeCount, blinkRate) {
    // Base score
    let score = 50;
    
    // Fixation count contribution (0-25 points)
    // Optimal: 3-5 fixations per 5 seconds
    if (fixationCount >= 3 && fixationCount <= 5) {
      score += 25;
    } else if (fixationCount > 0) {
      score += 25 * (1 - Math.min(1, Math.abs(4 - fixationCount) / 4));
    }
    
    // Fixation duration contribution (0-25 points)
    // Optimal: 200-400ms per fixation
    if (avgFixationDuration >= 200 && avgFixationDuration <= 400) {
      score += 25;
    } else if (avgFixationDuration > 0) {
      score += 25 * (1 - Math.min(1, Math.abs(300 - avgFixationDuration) / 300));
    }
    
    // Saccade count contribution (0-25 points)
    // Optimal: 2-4 saccades per 5 seconds
    if (saccadeCount >= 2 && saccadeCount <= 4) {
      score += 25;
    } else {
      score += 25 * (1 - Math.min(1, Math.abs(3 - saccadeCount) / 3));
    }
    
    // Blink rate contribution (-25 to 0 points)
    // Optimal: 10-20 blinks per minute
    if (blinkRate < 8) {
      // Very few blinks might indicate staring (reduced attention)
      score -= 25 * (1 - blinkRate / 8);
    } else if (blinkRate > 25) {
      // Too many blinks might indicate fatigue or distraction
      score -= 25 * Math.min(1, (blinkRate - 25) / 15);
    }
    
    // Ensure score is in 0-100 range
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate Euclidean distance between two 3D points
   */
  calculateDistance(point1, point2) {
    return Math.sqrt(
      Math.pow(point2.x - point1.x, 2) +
      Math.pow(point2.y - point1.y, 2) +
      Math.pow(point2.z - point1.z, 2)
    );
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.eyeTrackingData = [];
    this.lastBlink = 0;
    this.blinkCount = 0;
    this.fixations = [];
    this.saccades = [];
    this.attentionHistory = [];
  }
}

// Export a singleton instance
const attentionMetricsCalculator = new AttentionMetricsCalculator();