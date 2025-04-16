'use client';

import { WebRTCProvider } from '@/context/WebRTCContext';

export function WebRTCWrapper({ children }) {
  return (
    <WebRTCProvider>
      {children}
    </WebRTCProvider>
  );
}