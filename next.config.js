/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: false,
	webpack: (config) => {
		// This is needed for the MediaPipe and face-api.js libraries
		config.resolve.fallback = {
			...config.resolve.fallback,
			fs: false,
			path: false,
			encoding: false,
		};
		return config;
	},
	async headers() {
		return [
			{
				source: "/:path*",
				headers: [
					{
						key: "Content-Security-Policy",
						value:
							"default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self' ws: wss: http: https:;",
					},
					{ key: "Access-Control-Allow-Origin", value: "*" },
					{ key: "Cross-Origin-Opener-Policy", value: "same-origin" },
					{ key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
				],
			},
		];
	},
	async rewrites() {
		return process.env.NODE_ENV === "development"
			? [
					{
						source: "/socket.io/:path*",
						destination: "http://localhost:3001/socket.io/:path*",
					},
			  ]
			: [];
	},
	allowedDevOrigins: ["192.168.123.8"],
};

module.exports = nextConfig;
