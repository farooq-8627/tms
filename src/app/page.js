"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
	const router = useRouter();
	const [roomId, setRoomId] = useState("");

	const handleCreateRoom = () => {
		// Generate a random room ID
		const newRoomId = Math.random().toString(36).substring(2, 8);
		router.push(`/room/${newRoomId}?mode=host`);
	};

	const handleJoinRoom = (e) => {
		e.preventDefault();
		if (!roomId.trim()) {
			alert("Please enter a room ID");
			return;
		}
		router.push(`/room/${roomId}?mode=viewer`);
	};

	return (
		<main className="min-h-screen bg-[#0f172a] text-[#e2e8f0]">
			<div className="max-w-md mx-auto p-8">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-white mb-2">
						TMS Video Stream
					</h1>
					<p className="text-slate-400">
						Connect your phone and laptop for seamless video streaming
					</p>
				</div>

				<div className="space-y-6">
					{/* Create Room Button (for phones) */}
					<div>
						<button
							onClick={handleCreateRoom}
							className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
						>
							Create Room
							<span className="block text-sm font-normal text-blue-300">
								Use this on your phone to start streaming
							</span>
						</button>
					</div>

					{/* Join Room Form (for laptops) */}
					<div className="bg-slate-800/50 p-6 rounded-lg">
						<h2 className="text-lg font-semibold text-white mb-4">
							Join Existing Room
						</h2>
						<form onSubmit={handleJoinRoom} className="space-y-4">
							<div>
								<label
									htmlFor="roomId"
									className="block text-sm text-slate-400 mb-1"
								>
									Room ID
								</label>
								<input
									type="text"
									id="roomId"
									value={roomId}
									onChange={(e) => setRoomId(e.target.value)}
									placeholder="Enter room ID"
									className="w-full bg-slate-900 text-white px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
								/>
							</div>
							<button
								type="submit"
								className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
							>
								Join Room
								<span className="block text-sm font-normal text-slate-400">
									Use this on your laptop to view the stream
								</span>
							</button>
						</form>
					</div>
				</div>
			</div>
		</main>
	);
}
