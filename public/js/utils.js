/**
 * General utility functions
 */

// Generate a random ID for room creation
function generateRandomId(length = 5) {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Format a timestamp in mm:ss format
function formatTimestamp(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

// Map emotion name to emoji
function getEmotionEmoji(emotion) {
  const emojiMap = {
    'scanning': '🔍',
    'neutral': '😐',
    'happy': '😊',
    'sad': '😢',
    'angry': '😠',
    'surprised': '😮',
    'fearful': '😨',
    'disgusted': '🤢'
  };
  
  return emojiMap[emotion] || '🔍';
}

// Get heart rate status text
function getHeartRateStatus(rate) {
  if (rate < 60) return 'Below Average';
  if (rate < 70) return 'Resting';
  if (rate < 90) return 'Normal';
  if (rate < 110) return 'Elevated';
  return 'High';
}

// Get attention level text
function getAttentionText(level) {
  if (level < 30) return 'Low';
  if (level < 70) return 'Moderate';
  return 'High';
}

// Format coordinates as string
function formatCoords(point) {
  if (!point) return '--';
  return `(${point.x.toFixed(2)}, ${point.y.toFixed(2)})`;
}

// Draw heat map visualization
function drawHeatMap(canvas, points, width, height, radius = 30, intensity = 0.2) {
  if (!canvas || !points || points.length === 0) return;
  
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Create radial gradients for each point
  points.forEach(point => {
    const x = point.x * canvas.width;
    const y = point.y * canvas.height;
    
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(255, 0, 0, ${intensity})`);
    gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  });
}