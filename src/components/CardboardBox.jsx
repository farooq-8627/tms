'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function CardboardBox({ onAnimationComplete }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step === 3) {
      setTimeout(() => {
        onAnimationComplete();
      }, 500);
    }
  }, [step, onAnimationComplete]);

  // Animation for opening a cardboard box
  return (
    <motion.div 
      className="relative w-full max-w-lg aspect-square bg-amber-100 rounded-lg flex items-center justify-center overflow-hidden"
      initial={{ scale: 0.9, y: 50, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {step === 0 && (
        <motion.div 
          className="absolute inset-0 flex flex-col items-center justify-center p-8"
          exit={{ opacity: 0 }}
        >
          <h3 className="text-xl font-bold mb-4">Unbox Your BioVision</h3>
          <p className="text-center mb-6">Click to unpack your cutting-edge biometric analysis toolkit</p>
          <button 
            onClick={() => setStep(1)}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-md transition-colors"
          >
            Unbox Now
          </button>
        </motion.div>
      )}
      
      {step === 1 && (
        <motion.div 
          className="absolute inset-0 flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Box opening animation */}
          <div className="w-3/4 h-3/4 bg-amber-700 relative">
            <motion.div 
              className="w-full h-1/2 bg-amber-900 absolute top-0 origin-bottom"
              initial={{ rotateX: 0 }}
              animate={{ rotateX: -120 }}
              transition={{ duration: 1 }}
            />
          </div>
          <button 
            onClick={() => setStep(2)}
            className="mt-6 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-md transition-colors"
          >
            Continue
          </button>
        </motion.div>
      )}
      
      {step === 2 && (
        <motion.div 
          className="absolute inset-0 flex flex-col items-center justify-center p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-32 h-64 bg-gray-800 rounded-3xl border-4 border-gray-900 relative mb-4"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="w-24 h-48 bg-blue-500 absolute top-3 left-1/2 transform -translate-x-1/2 rounded-lg"></div>
            <div className="w-6 h-6 bg-gray-700 absolute bottom-3 left-1/2 transform -translate-x-1/2 rounded-full"></div>
          </motion.div>
          <h3 className="text-xl font-bold">Your Phone is the Key</h3>
          <p className="text-center mt-2 mb-6">Use your phone camera to activate BioVision</p>
          <button 
            onClick={() => setStep(3)}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-md transition-colors"
          >
            Let's Connect
          </button>
        </motion.div>
      )}
      
      {step === 3 && (
        <motion.div 
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [1, 0.8, 0]
            }}
            transition={{
              duration: 1.5,
              times: [0, 0.5, 1],
              repeat: 0
            }}
            className="w-32 h-32 bg-blue-500 rounded-full flex items-center justify-center"
          >
            <svg 
              className="w-16 h-16 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}