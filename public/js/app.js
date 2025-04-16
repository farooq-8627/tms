/**
 * BioVision Main Application
 * Controls the application flow and integrates all components
 */

document.addEventListener('DOMContentLoaded', function() {
  // UI Elements
  const welcomeScreen = document.getElementById('welcome-screen');
  const connectionScreen = document.getElementById('connection-screen');
  const roomIdInput = document.getElementById('room-id');
  const createRoomBtn = document.getElementById('createRoomBtn');
  const joinRoomBtn = document.getElementById('joinRoomBtn');
  const localVideo = document.getElementById('localVideo');
  const overlayCanvas = document.getElementById('overlayCanvas');
  const cameraStatus = document.getElementById('camera-status');
  
  // Metrics Elements
  const heartRateElement = document.getElementById('heartRate');
  const heartRateBar = document.getElementById('heartRateBar');
  const heartRateStatus = document.getElementById('heartRateStatus');
  const emotionEmoji = document.getElementById('emotionEmoji');
  const dominantEmotion = document.getElementById('dominantEmotion');
  const attentionScore = document.getElementById('attentionScore');
  const attentionBar = document.getElementById('attentionBar');
  const attentionStatus = document.getElementById('attentionStatus');
  const leftEyeCoords = document.getElementById('leftEyeCoords');
  const rightEyeCoords = document.getElementById('rightEyeCoords');
  const eyeTrackingCanvas = document.getElementById('eyeTrackingCanvas');
  
  // Metrics chart
  let metricsChart = null;
  const metricsHistory = {
    labels: [],
    heartRate: [],
    attention: []
  };
  
  // Initialize the room ID with a random value if empty
  if (!roomIdInput.value) {
    roomIdInput.value = generateRandomId();
  }
  
  // Initialize WebRTC
  webRTCManager.initSocket();
  
  // Create Room (for Phone)
  createRoomBtn.addEventListener('click', async () => {
    const roomId = roomIdInput.value;
    
    try {
      welcomeScreen.classList.add('hidden');
      connectionScreen.classList.remove('hidden');
      
      cameraStatus.textContent = 'Requesting camera access...';
      
      // Create room and get local stream
      const stream = await webRTCManager.createRoom(roomId);
      
      // Set up local video
      localVideo.srcObject = stream;
      cameraStatus.textContent = 'Created room: ' + roomId + ' (Phone View)';
      
      // Start heart rate monitoring
      initializeHeartRateMonitoring(localVideo);
      
      // Initialize face tracking
      initializeFaceTracking(localVideo, overlayCanvas);
      
    } catch (error) {
      console.error('Error creating room:', error);
      cameraStatus.textContent = 'Error: ' + error.message;
    }
  });
  
  // Join Room (for Laptop)
  joinRoomBtn.addEventListener('click', async () => {
    const roomId = roomIdInput.value;
    
    try {
      welcomeScreen.classList.add('hidden');
      connectionScreen.classList.remove('hidden');
      
      cameraStatus.textContent = 'Connecting to room: ' + roomId;
      
      // Join the room
      await webRTCManager.joinRoom(roomId);
      
      cameraStatus.textContent = 'Joined room: ' + roomId + ' (Laptop View)';
      
      // Set up UI for receiving data
      initializeMetricsPanel();
      
    } catch (error) {
      console.error('Error joining room:', error);
      cameraStatus.textContent = 'Error: ' + error.message;
    }
  });
  
  // Handle connection state changes
  webRTCManager.onConnectionStateChange = (state) => {
    cameraStatus.textContent = 'Connection state: ' + state;
    
    if (state === 'connected') {
      cameraStatus.textContent = 'Connected! Receiving biometric data...';
    } else if (state === 'disconnected' || state === 'failed') {
      cameraStatus.textContent = 'Connection lost. Please refresh and try again.';
    }
  };
  
  // Handle remote stream updates
  webRTCManager.onRemoteStreamUpdate = (stream) => {
    if (stream && !webRTCManager.isHost) {
      localVideo.srcObject = stream;
      cameraStatus.textContent = 'Receiving video stream';
      
      // Start biometric analysis on the received stream
      initializeFaceTracking(localVideo, overlayCanvas);
      initializeHeartRateMonitoring(localVideo);
    }
  };
  
  // Handle data channel messages
  webRTCManager.onDataChannelMessage = (data) => {
    if (data.type === 'biometrics') {
      updateMetricsUI(data);
    }
  };
  
  // Initialize heart rate monitoring
  function initializeHeartRateMonitoring(videoElement) {
    heartRateMonitor.initialize(videoElement);
    heartRateMonitor.onHeartRateUpdate = (heartRate) => {
      updateHeartRateUI(heartRate);
      
      // Send data to peer if we're the host
      if (webRTCManager.isHost) {
        webRTCManager.sendData({
          type: 'biometrics',
          heartRate: heartRate
        });
      }
    };
    heartRateMonitor.start();
  }
  
  // Initialize face tracking
  async function initializeFaceTracking(videoElement, canvasElement) {
    // Initialize MediaPipe for eye tracking
    const mediaPipeInitialized = await mediaPipeManager.initialize();
    
    if (mediaPipeInitialized) {
      mediaPipeManager.onEyeTrackingResults = (eyeData) => {
        if (eyeData) {
          updateEyeTrackingUI(eyeData);
          
          // Update attention metrics
          attentionMetricsCalculator.addEyeTrackingData(eyeData);
          
          // Send data to peer if we're the host
          if (webRTCManager.isHost) {
            webRTCManager.sendData({
              type: 'biometrics',
              eyeTracking: {
                leftEye: eyeData.leftEye?.center,
                rightEye: eyeData.rightEye?.center,
                gazeDirection: eyeData.gazeDirection
              }
            });
          }
        }
      };
      
      mediaPipeManager.startTracking(videoElement);
    }
    
    // Initialize Face API for emotion detection
    const faceApiInitialized = await faceAPIManager.loadModels();
    
    if (faceApiInitialized) {
      faceAPIManager.onEmotionDetected = (emotions) => {
        if (emotions) {
          updateEmotionUI(emotions);
          
          // Send data to peer if we're the host
          if (webRTCManager.isHost) {
            webRTCManager.sendData({
              type: 'biometrics',
              emotion: emotions
            });
          }
        }
      };
      
      faceAPIManager.startFaceDetection(videoElement);
    }
    
    // Set up attention metrics calculator
    attentionMetricsCalculator.onAttentionUpdate = (metrics) => {
      updateAttentionUI(metrics);
      
      // Send data to peer if we're the host
      if (webRTCManager.isHost) {
        webRTCManager.sendData({
          type: 'biometrics',
          attention: metrics
        });
      }
    };
  }
  
  // Update UI with heart rate data
  function updateHeartRateUI(rate) {
    if (!heartRateElement) return;
    
    heartRateElement.textContent = rate;
    heartRateBar.style.width = `${Math.min(100, (rate / 180) * 100)}%`;
    heartRateStatus.textContent = getHeartRateStatus(rate);
    
    // Add to history for chart
    updateMetricsHistory('heartRate', rate);
  }
  
  // Update UI with emotion data
  function updateEmotionUI(emotions) {
    if (!emotions || !emotionEmoji) return;
    
    // Update emoji and text
    emotionEmoji.textContent = getEmotionEmoji(emotions.dominant);
    dominantEmotion.textContent = emotions.dominant;
  }
  
  // Update UI with attention metrics
  function updateAttentionUI(metrics) {
    if (!metrics || !attentionScore) return;
    
    // Update score and progress bar
    attentionScore.textContent = metrics.attentionScore;
    attentionBar.style.width = `${metrics.attentionScore}%`;
    attentionStatus.textContent = getAttentionText(metrics.attentionScore) + ' attention detected';
    
    // Add to history for chart
    updateMetricsHistory('attention', metrics.attentionScore);
  }
  
  // Update UI with eye tracking data
  function updateEyeTrackingUI(eyeData) {
    if (!eyeData) return;
    
    // Update coordinates text
    if (eyeData.leftEye?.center) {
      leftEyeCoords.textContent = formatCoords(eyeData.leftEye.center);
    }
    
    if (eyeData.rightEye?.center) {
      rightEyeCoords.textContent = formatCoords(eyeData.rightEye.center);
    }
    
    // Draw eye tracking visualization
    if (eyeTrackingCanvas && eyeData.leftEye?.center && eyeData.rightEye?.center) {
      const ctx = eyeTrackingCanvas.getContext('2d');
      
      // Clear canvas
      ctx.clearRect(0, 0, eyeTrackingCanvas.width, eyeTrackingCanvas.height);
      
      // Draw face outline
      ctx.beginPath();
      ctx.ellipse(
        eyeTrackingCanvas.width / 2, 
        eyeTrackingCanvas.height / 2,
        eyeTrackingCanvas.width * 0.4,
        eyeTrackingCanvas.height * 0.6,
        0, 0, Math.PI * 2
      );
      ctx.strokeStyle = 'rgba(100, 100, 255, 0.5)';
      ctx.stroke();
      
      // Draw left eye
      const leftX = eyeTrackingCanvas.width * 0.35;
      const rightX = eyeTrackingCanvas.width * 0.65;
      const eyeY = eyeTrackingCanvas.height * 0.4;
      
      // Eye outlines
      ctx.beginPath();
      ctx.ellipse(leftX, eyeY, 15, 10, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.stroke();
      
      ctx.beginPath();
      ctx.ellipse(rightX, eyeY, 15, 10, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.stroke();
      
      // Iris positions - use gaze direction if available
      let leftIrisX = leftX;
      let leftIrisY = eyeY;
      let rightIrisX = rightX;
      let rightIrisY = eyeY;
      
      if (eyeData.gazeDirection) {
        // Apply gaze direction to iris positions (limited movement range)
        const maxMove = 8;
        leftIrisX += eyeData.gazeDirection.x * maxMove;
        leftIrisY += eyeData.gazeDirection.y * maxMove;
        rightIrisX += eyeData.gazeDirection.x * maxMove;
        rightIrisY += eyeData.gazeDirection.y * maxMove;
      }
      
      // Draw irises
      ctx.beginPath();
      ctx.arc(leftIrisX, leftIrisY, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 150, 255, 0.8)';
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(rightIrisX, rightIrisY, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 150, 255, 0.8)';
      ctx.fill();
      
      // Draw pupils
      ctx.beginPath();
      ctx.arc(leftIrisX, leftIrisY, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(rightIrisX, rightIrisY, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.fill();
    }
  }
  
  // Update metrics history for the chart
  function updateMetricsHistory(metricName, value) {
    const maxPoints = 20;
    const now = new Date();
    const timeLabel = now.getMinutes() + ':' + now.getSeconds().toString().padStart(2, '0');
    
    // Add data point
    if (metricsHistory.labels.length >= maxPoints) {
      metricsHistory.labels.shift();
      metricsHistory.heartRate.shift();
      metricsHistory.attention.shift();
    }
    
    // Only add time label if it's a new point
    if (metricsHistory.labels.length === 0 || 
        metricsHistory.labels[metricsHistory.labels.length - 1] !== timeLabel) {
      metricsHistory.labels.push(timeLabel);
      
      // Fill in missing data with null
      if (metricName !== 'heartRate') metricsHistory.heartRate.push(null);
      if (metricName !== 'attention') metricsHistory.attention.push(null);
    }
    
    // Update the specific metric
    if (metricName === 'heartRate') {
      metricsHistory.heartRate[metricsHistory.heartRate.length - 1] = value;
    } else if (metricName === 'attention') {
      metricsHistory.attention[metricsHistory.attention.length - 1] = value;
    }
    
    // Update chart if it exists
    updateMetricsChart();
  }
  
  // Initialize metrics chart
  function initializeMetricsPanel() {
    const ctx = document.getElementById('metricsChart');
    if (ctx && typeof Chart !== 'undefined') {
      metricsChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: metricsHistory.labels,
          datasets: [
            {
              label: 'Heart Rate (BPM)',
              data: metricsHistory.heartRate,
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              yAxisID: 'y',
              tension: 0.2
            },
            {
              label: 'Attention Score',
              data: metricsHistory.attention,
              borderColor: 'rgb(54, 162, 235)',
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              yAxisID: 'y1',
              tension: 0.2
            }
          ]
        },
        options: {
          responsive: true,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: {
                display: true,
                text: 'Heart Rate (BPM)'
              },
              min: 40,
              max: 120,
              grid: {
                color: 'rgba(255, 99, 132, 0.2)'
              }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              title: {
                display: true,
                text: 'Attention Score'
              },
              min: 0,
              max: 100,
              grid: {
                drawOnChartArea: false,
                color: 'rgba(54, 162, 235, 0.2)'
              }
            }
          }
        }
      });
    }
  }
  
  // Update metrics chart with new data
  function updateMetricsChart() {
    if (!metricsChart) return;
    
    metricsChart.data.labels = metricsHistory.labels;
    metricsChart.data.datasets[0].data = metricsHistory.heartRate;
    metricsChart.data.datasets[1].data = metricsHistory.attention;
    metricsChart.update();
  }
  
  // Update all metrics UI based on received data
  function updateMetricsUI(data) {
    if (data.heartRate) {
      updateHeartRateUI(data.heartRate);
    }
    
    if (data.emotion) {
      updateEmotionUI(data.emotion);
    }
    
    if (data.attention) {
      updateAttentionUI(data.attention);
    }
    
    if (data.eyeTracking) {
      const simulatedEyeData = {
        leftEye: {
          center: data.eyeTracking.leftEye
        },
        rightEye: {
          center: data.eyeTracking.rightEye
        },
        gazeDirection: data.eyeTracking.gazeDirection
      };
      updateEyeTrackingUI(simulatedEyeData);
    }
  }
  
  // Cardboard Box Animation
  function setupCardboardBox() {
    const box = document.getElementById('cardboardBox');
    if (!box) return;
    
    // Set up 3D box
    const faces = ['front', 'back', 'left', 'right', 'top', 'bottom'];
    const positions = [
      { transform: 'translateZ(100px)', width: '200px', height: '200px' },
      { transform: 'translateZ(-100px) rotateY(180deg)', width: '200px', height: '200px' },
      { transform: 'translateX(-100px) rotateY(-90deg)', width: '100px', height: '200px' },
      { transform: 'translateX(100px) rotateY(90deg)', width: '100px', height: '200px' },
      { transform: 'translateY(-100px) rotateX(90deg)', width: '200px', height: '100px' },
      { transform: 'translateY(100px) rotateX(-90deg)', width: '200px', height: '100px' }
    ];
    
    // Create box faces
    faces.forEach((face, index) => {
      const faceEl = document.createElement('div');
      faceEl.className = `cardboard-${face} absolute transform ${positions[index].transform}`;
      faceEl.style.width = positions[index].width;
      faceEl.style.height = positions[index].height;
      
      // Add cardboard texture
      const texture = document.createElement('div');
      texture.className = 'cardboard-texture absolute inset-0';
      faceEl.appendChild(texture);
      
      // Add tape for some faces
      if (['front', 'top'].includes(face)) {
        const tape = document.createElement('div');
        tape.className = 'cardboard-tape absolute';
        
        if (face === 'front') {
          tape.style.width = '80%';
          tape.style.height = '10px';
          tape.style.left = '10%';
          tape.style.top = '50%';
        } else {
          tape.style.width = '100%';
          tape.style.height = '15px';
          tape.style.left = '0';
          tape.style.top = '50%';
        }
        
        faceEl.appendChild(tape);
      }
      
      box.appendChild(faceEl);
    });
    
    // Add animation
    let step = 0;
    let rotateY = 0;
    
    const animateBox = () => {
      rotateY += 0.5;
      box.style.transform = `rotateY(${rotateY}deg)`;
      
      requestAnimationFrame(animateBox);
    };
    
    animateBox();
  }
  
  // Set up cardboard box animation
  setupCardboardBox();
});