'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function MetricsPanel() {
  // Placeholder data for demonstration
  const [metrics, setMetrics] = useState({
    heartRate: 0,
    emotion: 'scanning',
    attention: 0,
    eyeMovement: []
  });
  
  // Simulate metrics updating
  useEffect(() => {
    const interval = setInterval(() => {
      // In a real implementation, this would receive data from WebRTC data channel
      setMetrics(prevMetrics => ({
        ...prevMetrics,
        heartRate: Math.floor(60 + Math.random() * 40), // 60-100 range
        emotion: ['neutral', 'happy', 'surprised', 'sad'][Math.floor(Math.random() * 4)],
        attention: Math.min(100, prevMetrics.attention + (Math.random() > 0.5 ? 1 : -1) * Math.random() * 5)
      }));
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Emotion emoji mapping
  const emotionEmoji = {
    'scanning': '🔍',
    'neutral': '😐',
    'happy': '😊',
    'sad': '😢',
    'angry': '😠',
    'surprised': '😮',
    'fearful': '😨',
    'disgusted': '🤢'
  };
  
  // Attention level text
  const getAttentionText = (level) => {
    if (level < 30) return 'Low';
    if (level < 70) return 'Moderate';
    return 'High';
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full">
      <h2 className="text-2xl font-bold mb-6">Biometric Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Heart Rate */}
        <motion.div 
          className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg"
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <h3 className="text-lg font-semibold flex items-center">
            <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            Heart Rate
          </h3>
          <div className="flex items-end mt-2">
            <span className="text-4xl font-bold">{metrics.heartRate}</span>
            <span className="ml-2 text-gray-500">BPM</span>
          </div>
          <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-red-500"
              initial={{ width: '0%' }}
              animate={{ width: `${(metrics.heartRate - 40) / 1.4}%` }}
              transition={{ duration: 1 }}
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            {metrics.heartRate < 60 ? 'Below average' : 
             metrics.heartRate > 100 ? 'Above average' : 'Normal range'}
          </p>
        </motion.div>
        
        {/* Emotion Detection */}
        <motion.div 
          className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg"
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <h3 className="text-lg font-semibold flex items-center">
            <svg className="w-5 h-5 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7.536 5.879a1 1 0 001.415 0 3 3 0 014.242 0 1 1 0 001.415-1.415 5 5 0 00-7.072 0 1 1 0 000 1.415z" clipRule="evenodd" />
            </svg>
            Emotion
          </h3>
          <div className="flex flex-col items-center mt-4">
            <span className="text-5xl mb-2">{emotionEmoji[metrics.emotion]}</span>
            <span className="text-xl capitalize">{metrics.emotion}</span>
          </div>
        </motion.div>
        
        {/* Attention Level */}
        <motion.div 
          className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg"
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <h3 className="text-lg font-semibold flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            Attention Level
          </h3>
          <div className="flex items-end mt-2">
            <span className="text-4xl font-bold">{Math.round(metrics.attention)}</span>
            <span className="ml-2 text-gray-500">/ 100</span>
          </div>
          <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-blue-500"
              initial={{ width: '0%' }}
              animate={{ width: `${metrics.attention}%` }}
              transition={{ duration: 1 }}
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">{getAttentionText(metrics.attention)} attention detected</p>
        </motion.div>
        
        {/* Session Time */}
        <motion.div 
          className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg"
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <h3 className="text-lg font-semibold flex items-center">
            <svg className="w-5 h-5 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Session
          </h3>
          <div className="mt-4 flex items-center justify-between">
            <div className="text-center">
              <div className="text-2xl font-bold">00:05:23</div>
              <div className="text-sm text-gray-500">Elapsed Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">21</div>
              <div className="text-sm text-gray-500">Eye Movements</div>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-end mt-6 space-x-4">
        <button className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
          Export Data
        </button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          Save Session
        </button>
      </div>
    </div>
  );
}