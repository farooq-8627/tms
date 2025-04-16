/**
 * Create a new RTCPeerConnection with the specified configuration
 * @param {Object} config - Configuration for the peer connection
 * @returns {RTCPeerConnection} The created peer connection
 */
export const createPeerConnection = (config = {}) => {
  const defaultConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };
  
  const mergedConfig = { ...defaultConfig, ...config };
  
  return new RTCPeerConnection(mergedConfig);
};

/**
 * Add tracks from a media stream to a peer connection
 * @param {RTCPeerConnection} peerConnection - The peer connection
 * @param {MediaStream} stream - The media stream containing tracks to add
 */
export const addStreamToPeerConnection = (peerConnection, stream) => {
  if (!peerConnection || !stream) return;
  
  stream.getTracks().forEach(track => {
    peerConnection.addTrack(track, stream);
  });
};

/**
 * Create a data channel on a peer connection
 * @param {RTCPeerConnection} peerConnection - The peer connection
 * @param {String} label - The label for the data channel
 * @param {Object} options - Options for the data channel
 * @returns {RTCDataChannel} The created data channel
 */
export const createDataChannel = (peerConnection, label, options = {}) => {
  if (!peerConnection) return null;
  
  const defaultOptions = {
    ordered: true,
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  return peerConnection.createDataChannel(label, mergedOptions);
};

/**
 * Create an offer for a peer connection
 * @param {RTCPeerConnection} peerConnection - The peer connection
 * @returns {Promise<RTCSessionDescription>} A promise that resolves to the created offer
 */
export const createOffer = async (peerConnection) => {
  if (!peerConnection) throw new Error('Peer connection is null');
  
  const offer = await peerConnection.createOffer({
    offerToReceiveAudio: true,
    offerToReceiveVideo: true,
  });
  
  await peerConnection.setLocalDescription(offer);
  
  return offer;
};

/**
 * Create an answer for a peer connection
 * @param {RTCPeerConnection} peerConnection - The peer connection
 * @returns {Promise<RTCSessionDescription>} A promise that resolves to the created answer
 */
export const createAnswer = async (peerConnection) => {
  if (!peerConnection) throw new Error('Peer connection is null');
  
  const answer = await peerConnection.createAnswer();
  
  await peerConnection.setLocalDescription(answer);
  
  return answer;
};

/**
 * Set the remote description on a peer connection
 * @param {RTCPeerConnection} peerConnection - The peer connection
 * @param {RTCSessionDescription} description - The session description to set
 * @returns {Promise<void>} A promise that resolves when the description is set
 */
export const setRemoteDescription = async (peerConnection, description) => {
  if (!peerConnection) throw new Error('Peer connection is null');
  
  await peerConnection.setRemoteDescription(new RTCSessionDescription(description));
};

/**
 * Add an ICE candidate to a peer connection
 * @param {RTCPeerConnection} peerConnection - The peer connection
 * @param {RTCIceCandidate} candidate - The ICE candidate to add
 * @returns {Promise<void>} A promise that resolves when the candidate is added
 */
export const addIceCandidate = async (peerConnection, candidate) => {
  if (!peerConnection) throw new Error('Peer connection is null');
  
  await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
};

/**
 * Get user media with appropriate constraints
 * @param {Object} constraints - The constraints for getUserMedia
 * @returns {Promise<MediaStream>} A promise that resolves to the media stream
 */
export const getUserMedia = async (constraints = {}) => {
  const defaultConstraints = {
    audio: true,
    video: { facingMode: 'user' },
  };
  
  const mergedConstraints = { ...defaultConstraints, ...constraints };
  
  return await navigator.mediaDevices.getUserMedia(mergedConstraints);
};

/**
 * Stop all tracks in a media stream
 * @param {MediaStream} stream - The media stream containing tracks to stop
 */
export const stopMediaStream = (stream) => {
  if (!stream) return;
  
  stream.getTracks().forEach(track => {
    track.stop();
  });
};
