# WebRTC Signaling Server

This is a WebSocket-based signaling server for WebRTC video chat application. It handles room creation, peer connections, and WebRTC signaling.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

- Copy `.env.example` to `.env`
- Adjust the values as needed:
  - `PORT`: The port number for the server (default: 3001)
  - `ALLOWED_ORIGIN`: The allowed origin for CORS (default: http://localhost:3000)

## Running the Server

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

## WebSocket Message Types

The server handles the following message types:

- `create-room`: Creates a new room
- `join-room`: Joins an existing room
- `offer`: Relays WebRTC offer to peers
- `answer`: Relays WebRTC answer to peers
- `ice-candidate`: Relays ICE candidates to peers

Each message should be a JSON object with:

- `type`: The message type
- `roomId`: The room identifier
- `data`: The payload data
