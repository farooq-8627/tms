'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';

// Create the context
const WebRTCContext = createContext();

// Create a provider component
export const WebRTCProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [connectionState, setConnectionState] = useState('disconnected');
  const [roomId, setRoomId] = useState(null);
  const [remotePeerId, setRemotePeerId] = useState(null);

  // Initialize Socket.io connection
  useEffect(() => {
    // Connect to Socket.io server
    console.log('Connecting to signaling server');
    const newSocket = io('http://localhost:8000', {
      path: "/socket.io",
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to signaling server');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from signaling server');
      setConnectionState('disconnected');
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  // Setup event listeners for WebRTC signaling
  useEffect(() => {
    if (!socket) return;

    // When another user joins our room
    socket.on('user-connected', (userId) => {
      console.log('User connected:', userId);
      setRemotePeerId(userId);
      
      if (isHost) {
        // If we're the host, initiate the WebRTC connection
        createPeerConnection();
      }
    });

    // When a user disconnects
    socket.on('user-disconnected', (userId) => {
      console.log('User disconnected:', userId);
      setRemotePeerId(null);
      setConnectionState('disconnected');
      
      // Close and clean up the peer connection
      if (peerConnection) {
        peerConnection.close();
        setPeerConnection(null);
      }
    });

    // Handle incoming WebRTC offers
    socket.on('offer', async ({ offer, offererId, roomId }) => {
      console.log('Received offer from:', offererId);
      setRemotePeerId(offererId);
      
      // Create a peer connection if one doesn't exist
      const pc = peerConnection || await createPeerConnection();
      
      // Set the remote description from the offer
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        
        // Create an answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        // Send the answer back to the offerer
        socket.emit('answer', {
          answer,
          roomId,
          offererId
        });
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    });

    // Handle incoming WebRTC answers
    socket.on('answer', async ({ answer, answererId }) => {
      console.log('Received answer from:', answererId);
      
      if (peerConnection && peerConnection.signalingState !== 'stable') {
        try {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (error) {
          console.error('Error setting remote description:', error);
        }
      }
    });

    // Handle incoming ICE candidates
    socket.on('ice-candidate', async ({ candidate, senderId }) => {
      console.log('Received ICE candidate from:', senderId);
      
      if (peerConnection) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    });

    return () => {
      socket.off('user-connected');
      socket.off('user-disconnected');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
    };
  }, [socket, peerConnection, isHost]);

  // Create a WebRTC peer connection
  const createPeerConnection = useCallback(async () => {
    // Close existing connection if it exists
    if (peerConnection) {
      peerConnection.close();
    }

    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    const pc = new RTCPeerConnection(configuration);
    setPeerConnection(pc);

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket && remotePeerId) {
        socket.emit('ice-candidate', {
          candidate: event.candidate,
          roomId,
          targetId: remotePeerId
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('Connection state change:', pc.connectionState);
      setConnectionState(pc.connectionState);
    };

    // Handle receiving remote tracks
    pc.ontrack = (event) => {
      console.log('Received remote track');
      const stream = new MediaStream();
      event.streams[0].getTracks().forEach(track => {
        stream.addTrack(track);
      });
      setRemoteStream(stream);
    };

    // Add our local stream tracks to the connection if we're the host
    if (isHost && localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    // If we're the host and we have a remote peer, create and send an offer
    if (isHost && remotePeerId) {
      try {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await pc.setLocalDescription(offer);
        
        socket.emit('offer', {
          offer,
          roomId,
          targetId: remotePeerId
        });
      } catch (error) {
        console.error('Error creating offer:', error);
      }
    }

    return pc;
  }, [socket, roomId, remotePeerId, localStream, isHost, peerConnection]);

  // Create a room (for phone/host)
  const createRoom = useCallback(async (roomIdToCreate) => {
    try {
      // Get user media (camera and microphone)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true
      });
      
      setLocalStream(stream);
      setIsHost(true);
      setRoomId(roomIdToCreate);
      
      // Join the signaling room
      if (socket) {
        socket.emit('join-room', roomIdToCreate);
      }
    } catch (error) {
      console.error('Error creating room:', error);
    }
  }, [socket]);

  // Join an existing room (for laptop/viewer)
  const joinRoom = useCallback(async (roomIdToJoin) => {
    try {
      setIsHost(false);
      setRoomId(roomIdToJoin);
      
      // Join the signaling room
      if (socket) {
        socket.emit('join-room', roomIdToJoin);
      }
    } catch (error) {
      console.error('Error joining room:', error);
    }
  }, [socket]);

  // Context value
  const value = {
    localStream,
    remoteStream,
    isHost,
    connectionState,
    createRoom,
    joinRoom,
  };

  return (
    <WebRTCContext.Provider value={value}>
      {children}
    </WebRTCContext.Provider>
  );
};

// Custom hook to use the WebRTC context
export const useWebRTC = () => {
  const context = useContext(WebRTCContext);
  if (context === undefined) {
    throw new Error('useWebRTC must be used within a WebRTCProvider');
  }
  return context;
};
