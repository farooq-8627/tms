const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "../public")));

const io = new Server(server, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
});

// Store connected clients
const rooms = {};

io.on("connection", (socket) => {
	console.log("A user connected:", socket.id);

	// Join a room (each phone-laptop pair forms a room)
	socket.on("join-room", (roomId) => {
		console.log(`User ${socket.id} joining room ${roomId}`);

		// Create the room if it doesn't exist
		if (!rooms[roomId]) {
			rooms[roomId] = { users: [] };
		}

		// Add user to the room
		rooms[roomId].users.push(socket.id);
		socket.join(roomId);

		// Notify other users in the room
		socket.to(roomId).emit("user-connected", socket.id);

		// Send the current users in the room to the new user
		socket.emit(
			"room-users",
			rooms[roomId].users.filter((id) => id !== socket.id)
		);
	});

	// Handle WebRTC signaling messages
	socket.on("offer", ({ offer, roomId, targetId }) => {
		socket.to(targetId).emit("offer", {
			offer,
			offererId: socket.id,
			roomId,
		});
	});

	socket.on("answer", ({ answer, roomId, offererId }) => {
		socket.to(offererId).emit("answer", {
			answer,
			answererId: socket.id,
			roomId,
		});
	});

	socket.on("ice-candidate", ({ candidate, roomId, targetId }) => {
		socket.to(targetId).emit("ice-candidate", {
			candidate,
			senderId: socket.id,
			roomId,
		});
	});

	// Handle disconnection
	socket.on("disconnect", () => {
		console.log("User disconnected:", socket.id);

		// Remove user from all rooms they were in
		for (const roomId in rooms) {
			rooms[roomId].users = rooms[roomId].users.filter(
				(id) => id !== socket.id
			);

			// Delete room if empty
			if (rooms[roomId].users.length === 0) {
				delete rooms[roomId];
			} else {
				// Notify remaining users about the disconnection
				socket.to(roomId).emit("user-disconnected", socket.id);
			}
		}
	});
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
