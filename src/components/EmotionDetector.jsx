'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function EmotionDetector({ videoRef }) {
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [confidenceScores, setConfidenceScores] = useState({});
  const [showDetails, setShowDetails] = useState(false);
  
  const emotions = [
    'neutral', 
    'happy', 
    'sad', 
    'angry', 
    'fearful', 
    'disgusted', 
    'surprised'
  ];
  
  // Sample face detection (would use face-api.js in real implementation)
  useEffect(() => {
    if (!videoRef?.current) return;
    
    let isActive = true;
    
    const detectEmotions = () => {
      // Simulated emotion detection
      // In a real implementation, this would call face-api.js methods
      const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
      
      // Generate random confidence scores
      const scores = {};
      
      // Make the selected emotion have the highest score
      emotions.forEach(emotion => {
        scores[emotion] = Math.random() * 0.3;
      });
      scores[randomEmotion] += 0.7;
      
      if (isActive) {
        setCurrentEmotion(randomEmotion);
        setConfidenceScores(scores);
      }
    };
    
    // Run emotion detection every 2 seconds
    const intervalId = setInterval(detectEmotions, 2000);
    
    return () => {
      isActive = false;
      clearInterval(intervalId);
    };
  }, [videoRef]);
  
  // Emoji mapping for emotions
  const getEmoji = (emotion) => {
    switch (emotion) {
      case 'neutral': return '😐';
      case 'happy': return '😊';
      case 'sad': return '😢';
      case 'angry': return '😠';
      case 'fearful': return '😨';
      case 'disgusted': return '🤢';
      case 'surprised': return '😮';
      default: return '🔍';
    }
  };
  
  // Colors for emotions
  const getEmotionColor = (emotion) => {
    switch (emotion) {
      case 'neutral': return 'bg-gray-400';
      case 'happy': return 'bg-yellow-400';
      case 'sad': return 'bg-blue-400';
      case 'angry': return 'bg-red-500';
      case 'fearful': return 'bg-purple-400';
      case 'disgusted': return 'bg-green-500';
      case 'surprised': return 'bg-pink-400';
      default: return 'bg-gray-400';
    }
  };
  
  if (!currentEmotion) return null;
  
  return (
    <div className="absolute bottom-3 left-3">
      <motion.div 
        className="bg-black/70 backdrop-blur-sm rounded-lg p-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div 
          className="flex items-center cursor-pointer"
          onClick={() => setShowDetails(!showDetails)}
        >
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${getEmotionColor(currentEmotion)}`}>
            <span className="text-xl">{getEmoji(currentEmotion)}</span>
          </div>
          <div className="ml-2">
            <p className="text-white font-medium capitalize">{currentEmotion}</p>
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
            className="mt-2 space-y-1"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
          >
            {emotions.map(emotion => (
              <div key={emotion} className="flex items-center justify-between">
                <span className="text-xs text-white capitalize">{emotion}</span>
                <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden ml-2">
                  <div 
                    className={`h-full ${getEmotionColor(emotion)}`} 
                    style={{ width: `${(confidenceScores[emotion] || 0) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-white ml-1">
                  {Math.round((confidenceScores[emotion] || 0) * 100)}%
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}