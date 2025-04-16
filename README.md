# TMS (Telepresence Monitoring System)

A real-time video streaming application that enables seamless phone-to-laptop streaming using WebRTC technology.

## Features

- Real-time video streaming from phone to laptop
- Simple room-based connection system
- Automatic role detection (host/viewer)
- Clean, modern UI with connection status indicators
- WebRTC-powered peer-to-peer streaming

## Getting Started

### Prerequisites

- Node.js 16+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:

```bash
git clone https://github.com/farooq-8627/tms.git
cd tms
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Start the development server:

```bash
# Terminal 1 - Start the Next.js frontend
npm run dev
# or
yarn dev

# Terminal 2 - Start the WebRTC signaling server
node server/index.js
```

4. Open the application:
   - On your phone: Visit `http://<your-local-ip>:3000` and click "Create Room"
   - On your laptop: Visit `http://localhost:3000` and enter the room ID to join

## How It Works

1. The phone creates a room and starts the camera stream
2. The laptop joins the room using the provided room ID
3. WebRTC establishes a peer-to-peer connection
4. Video streams directly from phone to laptop

## Tech Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Node.js, Express
- **Real-time Communication**: WebRTC, Socket.IO
- **Development**: TypeScript, ESLint

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
