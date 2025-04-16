"use client";

import { useEffect, useRef, useState } from "react";
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
	const [copied, setCopied] = useState(false);

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

	const copyRoomId = () => {
		navigator.clipboard.writeText(roomId);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<main className="min-h-screen bg-[#0f172a] text-[#e2e8f0] p-4">
			<div className="max-w-6xl mx-auto">
				{/* Room Info Section */}
				<div className="mb-6 p-4 bg-slate-800/50 rounded-lg">
					<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
						<div>
							<h1 className="text-2xl font-bold text-white mb-2">
								{mode === "host" ? "Streaming Room" : "Viewing Room"}
							</h1>
							<div className="flex items-center space-x-2">
								<p className="text-slate-400">Room ID:</p>
								<code className="px-3 py-1 bg-slate-700 rounded font-mono text-white">
									{roomId}
								</code>
								<button
									onClick={copyRoomId}
									className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
								>
									{copied ? "Copied!" : "Copy"}
								</button>
							</div>
						</div>
						<div className="flex items-center space-x-2 bg-slate-700/50 px-4 py-2 rounded">
							<span
								className={`inline-block w-3 h-3 rounded-full ${
									connectionState === "connected"
										? "bg-green-500"
										: "bg-red-500"
								}`}
							/>
							<span className="text-sm">
								{connectionState === "connected"
									? "Connected"
									: "Waiting to connect..."}
							</span>
						</div>
					</div>
					{mode === "host" && (
						<p className="mt-4 text-sm text-slate-400 bg-slate-700/30 p-3 rounded">
							👋 Share this Room ID with someone to let them view your stream
							from their laptop
						</p>
					)}
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
