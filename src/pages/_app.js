import '../app/globals.css';
import { WebRTCProvider } from '@/context/WebRTCContext';

export default function MyApp({ Component, pageProps }) {
  return (
    <WebRTCProvider>
      <Component {...pageProps} />
    </WebRTCProvider>
  );
}