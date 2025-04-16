/**
 * Calculate attention metrics from eye tracking data
 * 
 * @param {Array} eyeTrackingData - Array of eye tracking data points
 * @returns {Object} Attention metrics
 */
export const calculateAttentionMetrics = (eyeTrackingData) => {
  if (!eyeTrackingData || eyeTrackingData.length < 2) {
    return {
      fixationCount: 0,
      avgFixationDuration: 0,
      saccadeCount: 0,
      attentionScore: 0
    };
  }
  
  // Identify fixations and saccades
  const { fixations, saccades } = identifyFixationsAndSaccades(eyeTrackingData);
  
  // Calculate metrics
  const fixationCount = fixations.length;
  
  // Calculate average fixation duration
  const totalFixationDuration = fixations.reduce((sum, fixation) => {
    return sum + (fixation.endTime - fixation.startTime);
  }, 0);
  
  const avgFixationDuration = fixationCount > 0 ? totalFixationDuration / fixationCount : 0;
  
  // Count saccades
  const saccadeCount = saccades.length;
  
  // Calculate an attention score (simplified version)
  const attentionScore = calculateAttentionScore(fixationCount, avgFixationDuration, saccadeCount);
  
  return {
    fixationCount,
    avgFixationDuration,
    saccadeCount,
    attentionScore
  };
};

/**
 * Identify fixations and saccades from eye tracking data
 * 
 * @param {Array} eyeTrackingData - Array of eye tracking data points
 * @returns {Object} Object containing fixations and saccades
 */
const identifyFixationsAndSaccades = (eyeTrackingData) => {
  const fixations = [];
  const saccades = [];
  
  // Settings for fixation detection
  const fixationRadius = 30; // pixels
  const minFixationDuration = 100; // milliseconds
  
  let currentFixation = null;
  let lastPoint = eyeTrackingData[0];
  
  for (let i = 1; i < eyeTrackingData.length; i++) {
    const point = eyeTrackingData[i];
    const distance = calculateDistance(lastPoint.x, lastPoint.y, point.x, point.y);
    
    if (distance <= fixationRadius) {
      // This point is part of a fixation
      if (!currentFixation) {
        // Start a new fixation
        currentFixation = {
          startIndex: i - 1,
          startTime: lastPoint.timestamp,
          points: [lastPoint, point],
          centerX: (lastPoint.x + point.x) / 2,
          centerY: (lastPoint.y + point.y) / 2
        };
      } else {
        // Add to current fixation
        currentFixation.points.push(point);
        
        // Update center
        const totalPoints = currentFixation.points.length;
        currentFixation.centerX = ((currentFixation.centerX * (totalPoints - 1)) + point.x) / totalPoints;
        currentFixation.centerY = ((currentFixation.centerY * (totalPoints - 1)) + point.y) / totalPoints;
      }
    } else {
      // This point is not part of the current fixation
      if (currentFixation) {
        // End the current fixation
        currentFixation.endIndex = i - 1;
        currentFixation.endTime = lastPoint.timestamp;
        
        // Only add if it meets the minimum duration
        if (currentFixation.endTime - currentFixation.startTime >= minFixationDuration) {
          fixations.push(currentFixation);
        }
        
        // Add a saccade between fixations
        saccades.push({
          startIndex: currentFixation.endIndex,
          endIndex: i,
          startTime: currentFixation.endTime,
          endTime: point.timestamp,
          startX: lastPoint.x,
          startY: lastPoint.y,
          endX: point.x,
          endY: point.y,
          distance: distance
        });
        
        currentFixation = null;
      } else if (i > 1) {
        // Add a saccade if we have at least two points and we're not already in a fixation
        saccades.push({
          startIndex: i - 1,
          endIndex: i,
          startTime: lastPoint.timestamp,
          endTime: point.timestamp,
          startX: lastPoint.x,
          startY: lastPoint.y,
          endX: point.x,
          endY: point.y,
          distance: distance
        });
      }
    }
    
    lastPoint = point;
  }
  
  // Handle the last fixation if it exists
  if (currentFixation) {
    currentFixation.endIndex = eyeTrackingData.length - 1;
    currentFixation.endTime = lastPoint.timestamp;
    
    if (currentFixation.endTime - currentFixation.startTime >= minFixationDuration) {
      fixations.push(currentFixation);
    }
  }
  
  return { fixations, saccades };
};

/**
 * Calculate Euclidean distance between two points
 * 
 * @param {Number} x1 - X coordinate of first point
 * @param {Number} y1 - Y coordinate of first point
 * @param {Number} x2 - X coordinate of second point
 * @param {Number} y2 - Y coordinate of second point
 * @returns {Number} Distance between the points
 */
const calculateDistance = (x1, y1, x2, y2) => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

/**
 * Calculate an attention score based on eye tracking metrics
 * 
 * @param {Number} fixationCount - Number of fixations
 * @param {Number} avgFixationDuration - Average fixation duration
 * @param {Number} saccadeCount - Number of saccades
 * @returns {Number} Attention score (0-100)
 */
const calculateAttentionScore = (fixationCount, avgFixationDuration, saccadeCount) => {
  // This is a simplified formula for attention score
  // A real implementation would use more sophisticated algorithms
  
  // Normalize metrics
  const normalizedFixationCount = Math.min(1, fixationCount / 20); // Normalize to 0-1
  const normalizedFixationDuration = Math.min(1, avgFixationDuration / 500); // Normalize to 0-1
  const normalizedSaccadeCount = Math.min(1, saccadeCount / 30); // Normalize to 0-1
  
  // Calculate score (weighted sum)
  // Higher fixation count and duration generally indicate better attention
  // Moderate saccade count is ideal (too few or too many indicate poor attention)
  const fixationWeight = 0.4;
  const durationWeight = 0.3;
  const saccadeWeight = 0.3;
  
  // Fixations and duration contribute positively, while extreme saccade values contribute negatively
  const saccadeScore = 1 - Math.abs(normalizedSaccadeCount - 0.5) * 2; // Penalize too few or too many
  
  const score = (
    (normalizedFixationCount * fixationWeight) +
    (normalizedFixationDuration * durationWeight) +
    (saccadeScore * saccadeWeight)
  ) * 100;
  
  return Math.round(score);
};

/**
 * Generate sample eye tracking data for testing
 * 
 * @param {Number} duration - Duration in milliseconds
 * @param {Number} fps - Frames per second
 * @returns {Array} Array of eye tracking data points
 */
export const generateSampleEyeTrackingData = (duration = 5000, fps = 30) => {
  const data = [];
  const totalFrames = Math.floor(duration * fps / 1000);
  const timeBetweenFrames = 1000 / fps;
  
  // Generate some random fixation points
  const fixationPoints = [
    { x: 200, y: 200, duration: 800 },
    { x: 600, y: 300, duration: 600 },
    { x: 300, y: 500, duration: 700 },
    { x: 700, y: 200, duration: 500 },
  ];
  
  let currentTime = 0;
  let currentFixationIndex = 0;
  let timeInCurrentFixation = 0;
  
  for (let i = 0; i < totalFrames; i++) {
    currentTime = i * timeBetweenFrames;
    
    // Check if we need to move to the next fixation
    if (currentFixationIndex < fixationPoints.length) {
      if (timeInCurrentFixation >= fixationPoints[currentFixationIndex].duration) {
        // Move to next fixation
        timeInCurrentFixation = 0;
        currentFixationIndex++;
      }
    }
    
    // Generate data point
    if (currentFixationIndex < fixationPoints.length) {
      // Within a fixation
      const fixation = fixationPoints[currentFixationIndex];
      
      // Add some random jitter to simulate slight eye movements during fixation
      const jitterX = Math.random() * 10 - 5;
      const jitterY = Math.random() * 10 - 5;
      
      data.push({
        timestamp: currentTime,
        x: fixation.x + jitterX,
        y: fixation.y + jitterY,
        isFixation: true
      });
      
      timeInCurrentFixation += timeBetweenFrames;
    } else {
      // Generate a random saccade
      data.push({
        timestamp: currentTime,
        x: Math.random() * 800,
        y: Math.random() * 600,
        isFixation: false
      });
    }
  }
  
  return data;
};
