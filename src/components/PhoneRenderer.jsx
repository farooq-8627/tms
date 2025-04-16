'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useWebRTC } from '@/context/WebRTCContext';
import VideoOverlay from './VideoOverlay';
import EmotionDetector from './EmotionDetector';
import HeartRateMonitor from './HeartRateMonitor';

export default function PhoneRenderer() {
  const [isLoading, setIsLoading] = useState(true);
  const [rotateY, setRotateY] = useState(0);
  const { localStream, remoteStream, isHost } = useWebRTC();
  const videoRef = useRef();

  // Initialize drag to rotate
  useEffect(() => {
    let isDragging = false;
    let prevX = 0;

    const handleMouseDown = (e) => {
      isDragging = true;
      prevX = e.clientX;
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevX;
      setRotateY(prev => prev + deltaX * 0.5);
      prevX = e.clientX;
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Attach stream to video element
  useEffect(() => {
    if (videoRef.current) {
      if (isHost && localStream) {
        videoRef.current.srcObject = localStream;
        setIsLoading(false);
      } else if (!isHost && remoteStream) {
        videoRef.current.srcObject = remoteStream;
        setIsLoading(false);
      }
    }
  }, [localStream, remoteStream, isHost]);

  return (
    <div className="w-full flex flex-col items-center">
      <motion.div 
        className="relative perspective-1000"
        style={{ 
          transform: `rotateY(${rotateY}deg)`,
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Phone body */}
        <div className="w-64 h-[500px] bg-gray-800 rounded-3xl border-4 border-gray-900 relative">
          {/* Screen */}
          <div className="w-56 h-[400px] bg-gray-900 absolute top-3 left-1/2 transform -translate-x-1/2 rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="relative w-full h-full bg-black">
                <video 
                  ref={videoRef} 
                  className="w-full h-full object-cover" 
                  autoPlay 
                  playsInline
                  muted
                />
                <VideoOverlay videoRef={videoRef} />
                {!isHost && (
                  <>
                    <EmotionDetector videoRef={videoRef} />
                    <HeartRateMonitor videoRef={videoRef} />
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Home button */}
          <div className="w-12 h-12 bg-gray-700 absolute bottom-3 left-1/2 transform -translate-x-1/2 rounded-full border-2 border-gray-600 flex items-center justify-center">
            <div className="w-6 h-6 rounded-sm border-2 border-gray-500"></div>
          </div>
          
          {/* Front camera and speaker */}
          <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-24 h-4 bg-gray-700 rounded-full flex items-center justify-center space-x-4">
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            <div className="w-8 h-1 bg-gray-600 rounded-full"></div>
          </div>
        </div>
        
        {/* Shadow */}
        <div className="w-56 h-8 bg-black/20 rounded-full blur-md mx-auto mt-4"></div>
      </motion.div>
      
      <p className="text-sm text-gray-500 mt-4">
        {isHost ? "This is your camera feed" : "Drag to rotate phone view"}
      </p>
    </div>
  );
}