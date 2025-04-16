import { WebSocketServer } from "ws";

const rooms = new Map();

export function GET(req) {
	if (!res.socket.server.ws) {
		const wss = new WebSocketServer({ server: res.socket.server });
		res.socket.server.ws = wss;

		wss.on("connection", (ws) => {
			console.log("New client connected");

			let clientRoom = null;
			let clientId = null;

			ws.on("message", (message) => {
				try {
					const data = JSON.parse(message);

					switch (data.type) {
						case "create-room": {
							const roomId = data.roomId;
							if (rooms.has(roomId)) {
								ws.send(
									JSON.stringify({
										type: "error",
										message: "Room already exists",
									})
								);
								return;
							}

							rooms.set(roomId, new Map([[data.userId, ws]]));
							clientRoom = roomId;
							clientId = data.userId;

							ws.send(
								JSON.stringify({
									type: "room-created",
									roomId,
								})
							);
							break;
						}

						case "join-room": {
							const roomId = data.roomId;
							const room = rooms.get(roomId);

							if (!room) {
								ws.send(
									JSON.stringify({
										type: "error",
										message: "Room not found",
									})
								);
								return;
							}

							room.set(data.userId, ws);
							clientRoom = roomId;
							clientId = data.userId;

							// Notify other participants
							room.forEach((participant, participantId) => {
								if (participantId !== data.userId) {
									participant.send(
										JSON.stringify({
											type: "user-joined",
											userId: data.userId,
										})
									);
								}
							});

							ws.send(
								JSON.stringify({
									type: "room-joined",
									roomId,
									participants: Array.from(room.keys()),
								})
							);
							break;
						}

						case "offer":
						case "answer":
						case "ice-candidate": {
							const room = rooms.get(data.roomId);
							if (!room) return;

							const targetWs = room.get(data.target);
							if (!targetWs) return;

							targetWs.send(
								JSON.stringify({
									type: data.type,
									payload: data.payload,
									from: data.from,
								})
							);
							break;
						}
					}
				} catch (error) {
					console.error("Error processing message:", error);
				}
			});

			ws.on("close", () => {
				console.log("Client disconnected");

				if (clientRoom && clientId) {
					const room = rooms.get(clientRoom);
					if (room) {
						room.delete(clientId);

						// Notify other participants about the disconnection
						room.forEach((participant) => {
							participant.send(
								JSON.stringify({
									type: "user-left",
									userId: clientId,
								})
							);
						});

						// Remove room if empty
						if (room.size === 0) {
							rooms.delete(clientRoom);
						}
					}
				}
			});
		});
	}

	return new Response("WebSocket server is running", {
		status: 101,
		webSocket: res.socket.server.ws,
	});
}
