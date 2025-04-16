import "./globals.css";
import { Inter, Space_Grotesk } from "next/font/google";
import { WebRTCWrapper } from "@/components/WebRTCWrapper";

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
	subsets: ["latin"],
	variable: "--font-space-grotesk",
});

export const metadata = {
	title: "BioVision - Real-time Biometric Analysis",
	description:
		"A Next.js application for real-time video analysis with eye-tracking, emotion detection, and heart rate monitoring",
};

export default function RootLayout({ children }) {
	return (
		<html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
			<body className={`${inter.className} bg-[#0f172a]`}>
				<WebRTCWrapper>{children}</WebRTCWrapper>
			</body>
		</html>
	);
}
