'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function HeartRateMonitor({ videoRef }) {
  const [heartRate, setHeartRate] = useState(0);
  const [isProcessing, setIsProcessing] = useState(true);
  const [pulseHistory, setPulseHistory] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  
  const canvasRef = useRef(null);
  const bufferRef = useRef([]);
  const timeRef = useRef(Date.now());
  
  useEffect(() => {
    if (!videoRef?.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    // Set canvas size (small for performance)
    canvas.width = 32;
    canvas.height = 32;
    
    let animationFrameId;
    let isActive = true;
    
    // Create a buffer for averaging
    const sampleInterval = 30; // Sample every 30ms
    
    const processSample = () => {
      if (!isActive || !video.videoWidth) return;
      
      const now = Date.now();
      if (now - timeRef.current < sampleInterval) {
        animationFrameId = requestAnimationFrame(processSample);
        return;
      }
      
      timeRef.current = now;
      
      // Draw video to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get pixel data from face region (center of frame)
      const faceRegion = ctx.getImageData(
        Math.floor(canvas.width * 0.3),
        Math.floor(canvas.height * 0.3),
        Math.floor(canvas.width * 0.4),
        Math.floor(canvas.height * 0.4)
      );
      
      // Calculate average RGB
      let r = 0, g = 0, b = 0;
      for (let i = 0; i < faceRegion.data.length; i += 4) {
        r += faceRegion.data[i];
        g += faceRegion.data[i + 1];
        b += faceRegion.data[i + 2];
      }
      
      const pixelCount = faceRegion.data.length / 4;
      r /= pixelCount;
      g /= pixelCount;
      b /= pixelCount;
      
      // Add to buffer
      bufferRef.current.push({ r, g, b, time: now });
      
      // Keep buffer at reasonable size
      if (bufferRef.current.length > 150) {
        bufferRef.current.shift();
      }
      
      // After collecting enough samples, calculate heart rate
      if (bufferRef.current.length > 60 && isProcessing) {
        calculateHeartRate();
      }
      
      animationFrameId = requestAnimationFrame(processSample);
    };
    
    const calculateHeartRate = () => {
      // In a real implementation, this would extract the heart rate through
      // rPPG (remote photoplethysmography) from the RGB values
      // For demo purposes, we'll simulate a heart rate calculation
      
      // Simulated heart rate between 60-100 BPM with slight variations
      const baseRate = 75;
      const randomVariation = Math.sin(Date.now() / 1000) * 10;
      const calculatedRate = Math.round(baseRate + randomVariation);
      
      setHeartRate(calculatedRate);
      setIsProcessing(false);
      
      // Add to pulse history
      setPulseHistory(prev => {
        const newHistory = [...prev, calculatedRate];
        if (newHistory.length > 20) {
          return newHistory.slice(-20);
        }
        return newHistory;
      });
      
      // Schedule the next calculation
      setTimeout(() => {
        setIsProcessing(true);
      }, 2000);
    };
    
    // Start the processing
    processSample();
    
    return () => {
      isActive = false;
      cancelAnimationFrame(animationFrameId);
    };
  }, [videoRef]);
  
  // Get heart rate status text
  const getHeartRateStatus = (rate) => {
    if (rate < 60) return 'Below Average';
    if (rate < 70) return 'Resting';
    if (rate < 90) return 'Normal';
    if (rate < 110) return 'Elevated';
    return 'High';
  };
  
  // Get heart rate color
  const getHeartRateColor = (rate) => {
    if (rate < 60) return 'text-blue-400';
    if (rate < 70) return 'text-green-400';
    if (rate < 90) return 'text-green-500';
    if (rate < 110) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  return (
    <>
      {/* Invisible canvas for processing */}
      <canvas 
        ref={canvasRef} 
        className="hidden"
      />
      
      {/* Heart rate display */}
      <div className="absolute top-3 right-3">
        <motion.div 
          className="bg-black/70 backdrop-blur-sm rounded-lg p-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div 
            className="flex items-center cursor-pointer"
            onClick={() => setShowDetails(!showDetails)}
          >
            <div className="flex items-center">
              <svg 
                className={`w-5 h-5 mr-1 ${isProcessing ? 'animate-pulse text-red-500' : 'text-red-500'}`} 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              <div>
                <span className={`font-bold ${getHeartRateColor(heartRate)}`}>
                  {isProcessing ? '...' : heartRate}
                </span>
                <span className="text-white ml-1 text-xs">BPM</span>
              </div>
            </div>
            <div className="ml-2">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-4 w-4 text-white transform transition-transform ${showDetails ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          
          {showDetails && (
            <motion.div 
              className="mt-2 pt-2 border-t border-gray-600"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-xs text-white">
                Status: <span className={getHeartRateColor(heartRate)}>{getHeartRateStatus(heartRate)}</span>
              </div>
              
              {/* Mini graph of heart rate history */}
              <div className="mt-2 h-12 flex items-end justify-between space-x-0.5">
                {pulseHistory.map((rate, i) => (
                  <div 
                    key={i}
                    className={`w-1 bg-red-500 rounded-t transition-all`}
                    style={{ 
                      height: `${Math.max(10, ((rate - 40) / 140) * 100)}%`,
                      opacity: i === pulseHistory.length - 1 ? 1 : 0.5 + (i / pulseHistory.length) * 0.5
                    }}
                  />
                ))}
                {pulseHistory.length === 0 && (
                  <div className="w-full text-center text-xs text-gray-400">
                    Collecting data...
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </>
  );
}