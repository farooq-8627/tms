/**
 * WebRTC Connectivity Module
 * Handles peer-to-peer connections between devices
 */

class WebRTCManager {
  constructor() {
    this.socket = null;
    this.peerConnection = null;
    this.dataChannel = null;
    this.localStream = null;
    this.remoteStream = null;
    this.roomId = null;
    this.isHost = false;
    this.connectionState = 'disconnected';
    this.onConnectionStateChange = null;
    this.onRemoteStreamUpdate = null;
    this.onDataChannelMessage = null;
  }

  /**
   * Initialize socket connection
   */
  initSocket() {
    // Connect to signaling server
    const serverUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:8000'
      : window.location.origin;
    
    console.log('Connecting to signaling server');
    this.socket = io(serverUrl);
    
    // Set up socket event handlers
    this.socket.on('user-connected', async (userId) => {
      console.log('User connected:', userId);
      
      // If we're the host, initiate a connection to the new user
      if (this.isHost) {
        await this.createPeerConnection();
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        
        this.socket.emit('offer', {
          offer,
          roomId: this.roomId,
          targetId: userId
        });
      }
    });
    
    this.socket.on('offer', async ({ offer, offererId, roomId }) => {
      console.log('Received offer from:', offererId);
      
      if (roomId === this.roomId) {
        await this.createPeerConnection();
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        
        this.socket.emit('answer', {
          answer,
          roomId,
          offererId
        });
      }
    });
    
    this.socket.on('answer', async ({ answer, answererId, roomId }) => {
      console.log('Received answer from:', answererId);
      
      if (roomId === this.roomId && this.peerConnection) {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });
    
    this.socket.on('ice-candidate', async ({ candidate, senderId, roomId }) => {
      if (roomId === this.roomId && this.peerConnection) {
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    });
    
    this.socket.on('user-disconnected', (userId) => {
      console.log('User disconnected:', userId);
      this.setConnectionState('disconnected');
    });
  }

  /**
   * Set connection state and trigger callback
   */
  setConnectionState(state) {
    this.connectionState = state;
    
    if (this.onConnectionStateChange) {
      this.onConnectionStateChange(state);
    }
  }

  /**
   * Create a WebRTC peer connection
   */
  async createPeerConnection() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ]
    });
    
    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('ice-candidate', {
          candidate: event.candidate,
          roomId: this.roomId,
          targetId: this.isHost ? this.remoteUserId : this.hostId
        });
      }
    };
    
    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      this.setConnectionState(this.peerConnection.connectionState);
    };
    
    // Handle receiving tracks
    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      
      if (this.onRemoteStreamUpdate) {
        this.onRemoteStreamUpdate(this.remoteStream);
      }
    };
    
    // Setup data channel for biometric data exchange
    if (this.isHost) {
      this.dataChannel = this.peerConnection.createDataChannel('biometrics');
      this.setupDataChannel(this.dataChannel);
    } else {
      this.peerConnection.ondatachannel = (event) => {
        this.dataChannel = event.channel;
        this.setupDataChannel(this.dataChannel);
      };
    }
    
    // Add local stream if available
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }
  }

  /**
   * Set up data channel for biometric data exchange
   */
  setupDataChannel(channel) {
    channel.onopen = () => {
      console.log('Data channel opened');
    };
    
    channel.onclose = () => {
      console.log('Data channel closed');
    };
    
    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (this.onDataChannelMessage) {
          this.onDataChannelMessage(data);
        }
      } catch (error) {
        console.error('Error parsing data channel message:', error);
      }
    };
  }

  /**
   * Send data through the data channel
   */
  sendData(data) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(data));
    }
  }

  /**
   * Create a room (for phone/host)
   */
  async createRoom(roomIdToCreate) {
    try {
      this.roomId = roomIdToCreate;
      this.isHost = true;
      
      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });
      
      // Join the room
      this.socket.emit('join-room', this.roomId);
      
      // Return the stream for local display
      return this.localStream;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  }

  /**
   * Join an existing room (for laptop/viewer)
   */
  async joinRoom(roomIdToJoin) {
    try {
      this.roomId = roomIdToJoin;
      this.isHost = false;
      
      // Join the room
      this.socket.emit('join-room', this.roomId);
    } catch (error) {
      console.error('Error joining room:', error);
      throw error;
    }
  }

  /**
   * Disconnect and clean up resources
   */
  disconnect() {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    this.remoteStream = null;
    this.dataChannel = null;
    this.setConnectionState('disconnected');
  }
}

// Export a singleton instance
const webRTCManager = new WebRTCManager();