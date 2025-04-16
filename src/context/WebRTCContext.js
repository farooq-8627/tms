"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

const WebRTCContext = createContext();

const configuration = {
	iceServers: [
		{
			urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
		},
	],
};

export function WebRTCProvider({ children }) {
	const [socket, setSocket] = useState(null);
	const [localStream, setLocalStream] = useState(null);
	const [remoteStream, setRemoteStream] = useState(null);
	const [error, setError] = useState(null);
	const peerConnection = useRef(null);

	useEffect(() => {
		const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
		const wsUrl = `${wsProtocol}//${window.location.host}/api/socket`;
		const ws = new WebSocket(wsUrl);

		ws.onopen = () => {
			console.log("Connected to WebSocket server");
			setSocket(ws);
		};

		ws.onerror = (error) => {
			console.error("WebSocket error:", error);
			setError("Failed to connect to WebSocket server");
		};

		ws.onclose = () => {
			console.log("Disconnected from WebSocket server");
			setSocket(null);
		};

		return () => {
			if (ws) {
				ws.close();
			}
		};
	}, []);

	const createRoom = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: true,
				audio: true,
			});
			setLocalStream(stream);

			peerConnection.current = new RTCPeerConnection(configuration);
			stream.getTracks().forEach((track) => {
				peerConnection.current.addTrack(track, stream);
			});

			peerConnection.current.ontrack = (event) => {
				setRemoteStream(event.streams[0]);
			};

			const offer = await peerConnection.current.createOffer();
			await peerConnection.current.setLocalDescription(offer);

			if (socket) {
				socket.send(
					JSON.stringify({
						type: "create-room",
						offer: offer,
					})
				);
			}
		} catch (err) {
			console.error("Error creating room:", err);
			setError("Failed to create room");
		}
	};

	const joinRoom = async (roomId) => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: true,
				audio: true,
			});
			setLocalStream(stream);

			peerConnection.current = new RTCPeerConnection(configuration);
			stream.getTracks().forEach((track) => {
				peerConnection.current.addTrack(track, stream);
			});

			peerConnection.current.ontrack = (event) => {
				setRemoteStream(event.streams[0]);
			};

			if (socket) {
				socket.send(
					JSON.stringify({
						type: "join-room",
						roomId: roomId,
					})
				);
			}
		} catch (err) {
			console.error("Error joining room:", err);
			setError("Failed to join room");
		}
	};

	const value = {
		socket,
		localStream,
		remoteStream,
		error,
		createRoom,
		joinRoom,
	};

	return (
		<WebRTCContext.Provider value={value}>{children}</WebRTCContext.Provider>
	);
}

export function useWebRTC() {
	const context = useContext(WebRTCContext);
	if (!context) {
		throw new Error("useWebRTC must be used within a WebRTCProvider");
	}
	return context;
}
