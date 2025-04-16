'use client';

import { useRef, useEffect, useState } from 'react';

export default function VideoOverlay({ videoRef }) {
  const [faceBounds, setFaceBounds] = useState(null);
  const [eyePoints, setEyePoints] = useState({ left: null, right: null });
  const canvasRef = useRef(null);
  const frameCountRef = useRef(0);
  
  // Draw face tracking overlay on canvas
  useEffect(() => {
    if (!videoRef?.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    let animationFrameId;
    
    // Resize canvas to match video dimensions
    const handleResize = () => {
      if (video && canvas) {
        canvas.width = video.clientWidth;
        canvas.height = video.clientHeight;
      }
    };
    
    // Call resize immediately and on window resize
    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Function to draw tracking overlay
    const drawOverlay = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Only update tracking data every 15 frames for performance
      frameCountRef.current++;
      if (frameCountRef.current % 15 === 0) {
        // In a real implementation, this would use face-api.js or mediapipe
        // to detect face landmarks and track eye movement
        
        // Simulate face detection with random wobble
        const wobble = Math.sin(Date.now() / 1000) * 5;
        setFaceBounds({
          x: canvas.width * 0.25 + wobble,
          y: canvas.height * 0.2 + wobble,
          width: canvas.width * 0.5,
          height: canvas.height * 0.6
        });
        
        // Simulate eye detection
        setEyePoints({
          left: {
            x: canvas.width * 0.35 + Math.random() * 2,
            y: canvas.height * 0.35 + Math.random() * 2
          },
          right: {
            x: canvas.width * 0.65 + Math.random() * 2,
            y: canvas.height * 0.35 + Math.random() * 2
          }
        });
      }
      
      // Draw face bounding box
      if (faceBounds) {
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(
          faceBounds.x, 
          faceBounds.y, 
          faceBounds.width, 
          faceBounds.height
        );
        
        // Face metrics text
        ctx.font = '12px monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(faceBounds.x, faceBounds.y - 20, 120, 20);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillText(
          `Face ID: #1293`, 
          faceBounds.x + 5, 
          faceBounds.y - 5
        );
      }
      
      // Draw eye tracking points
      if (eyePoints.left && eyePoints.right) {
        const drawEye = (point, label) => {
          // Outer circle
          ctx.beginPath();
          ctx.arc(point.x, point.y, 12, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(0, 160, 255, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([]);
          ctx.stroke();
          
          // Inner circle (pupil)
          ctx.beginPath();
          ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0, 160, 255, 0.8)';
          ctx.fill();
          
          // Label
          ctx.font = '10px monospace';
          ctx.fillStyle = 'white';
          ctx.textAlign = 'center';
          ctx.fillText(label, point.x, point.y + 25);
        };
        
        drawEye(eyePoints.left, 'Left Eye');
        drawEye(eyePoints.right, 'Right Eye');
        
        // Connect eyes with a line
        ctx.beginPath();
        ctx.moveTo(eyePoints.left.x, eyePoints.left.y);
        ctx.lineTo(eyePoints.right.x, eyePoints.right.y);
        ctx.strokeStyle = 'rgba(0, 160, 255, 0.3)';
        ctx.setLineDash([2, 2]);
        ctx.stroke();
      }
      
      // Continue animation
      animationFrameId = requestAnimationFrame(drawOverlay);
    };
    
    // Start animation loop
    drawOverlay();
    
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [videoRef]);
  
  return (
    <canvas 
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
    />
  );
}