"use client";

import { useEffect, useRef } from "react";
import { useWebRTC } from "@/context/WebRTCContext";
import { useSearchParams } from "next/navigation";
import { use } from "react";

export default function RoomPage({ params }) {
	const resolvedParams = use(params);
	const { roomId } = resolvedParams;
	const searchParams = useSearchParams();
	const mode = searchParams.get("mode");
	const { localStream, remoteStream, connectionState, createRoom, joinRoom } =
		useWebRTC();

	const localVideoRef = useRef(null);
	const remoteVideoRef = useRef(null);

	// Initialize room connection
	useEffect(() => {
		const initializeRoom = async () => {
			try {
				if (mode === "host") {
					await createRoom(roomId);
				} else {
					await joinRoom(roomId);
				}
			} catch (error) {
				console.error("Failed to initialize room:", error);
				alert("Failed to initialize room. Please try again.");
			}
		};

		initializeRoom();
	}, [roomId, mode, createRoom, joinRoom]);

	// Handle local video stream
	useEffect(() => {
		if (localVideoRef.current && localStream) {
			localVideoRef.current.srcObject = localStream;
		}
	}, [localStream]);

	// Handle remote video stream
	useEffect(() => {
		if (remoteVideoRef.current && remoteStream) {
			remoteVideoRef.current.srcObject = remoteStream;
		}
	}, [remoteStream]);

	return (
		<main className="min-h-screen bg-[#0f172a] text-[#e2e8f0] p-4">
			<div className="max-w-6xl mx-auto">
				<div className="mb-4 flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold text-white">Room: {roomId}</h1>
						<p className="text-slate-400">
							Mode: {mode === "host" ? "Phone (Host)" : "Laptop (Viewer)"}
						</p>
					</div>
					<div className="flex items-center space-x-2">
						<span
							className={`inline-block w-3 h-3 rounded-full ${
								connectionState === "connected" ? "bg-green-500" : "bg-red-500"
							}`}
						/>
						<span className="text-sm text-slate-400">
							{connectionState === "connected" ? "Connected" : "Disconnected"}
						</span>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{/* Local Video (only show for host) */}
					{mode === "host" && (
						<div className="relative aspect-video bg-slate-800 rounded-lg overflow-hidden">
							<video
								ref={localVideoRef}
								autoPlay
								playsInline
								muted
								className="absolute inset-0 w-full h-full object-cover"
							/>
							<div className="absolute bottom-4 left-4">
								<span className="px-2 py-1 bg-slate-900/75 rounded text-sm">
									Your Camera
								</span>
							</div>
						</div>
					)}

					{/* Remote Video */}
					<div
						className={`relative aspect-video bg-slate-800 rounded-lg overflow-hidden ${
							mode === "host" ? "" : "md:col-span-2"
						}`}
					>
						<video
							ref={remoteVideoRef}
							autoPlay
							playsInline
							className="absolute inset-0 w-full h-full object-cover"
						/>
						<div className="absolute bottom-4 left-4">
							<span className="px-2 py-1 bg-slate-900/75 rounded text-sm">
								{mode === "host" ? "Laptop View" : "Phone Camera"}
							</span>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
