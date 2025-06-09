'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface WavePoint {
  x: number;
  y: number;
}

// Custom hook for window dimensions
function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState({
    width: 800,
    height: 600
  });

  useEffect(() => {
    function handleResize() {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }

    // Only run on client side
    if (typeof window !== 'undefined') {
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  return windowDimensions;
}

export default function VibeGraph() {
  const [time, setTime] = useState(0);
  const [frequency, setFrequency] = useState(1);
  const [wavePoints, setWavePoints] = useState<WavePoint[]>([]);
  const [currentDot, setCurrentDot] = useState({ x: 0, y: 0 });
  const [moodText, setMoodText] = useState("We're so back...");
  const [animationSpeed, setAnimationSpeed] = useState(0.01);
  const [isClient, setIsClient] = useState(false);

  const windowDimensions = useWindowDimensions();

  // Graph dimensions - responsive
  const width = Math.min(windowDimensions.width * 0.85, 800);
  const height = windowDimensions.width < 768 ? 250 : 300;
  const centerY = height / 2;
  const amplitude = windowDimensions.width < 768 ? 60 : 80;
  const waveLength = width / 4;

  // Prevent hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Generate wave points
  const generateWavePoints = useCallback((timeOffset: number, freq: number): WavePoint[] => {
    const points: WavePoint[] = [];
    const numPoints = 200;
    
    for (let i = 0; i <= numPoints; i++) {
      const x = (i / numPoints) * width;
      const angle = ((x / waveLength) * Math.PI * 2 * freq) + timeOffset;
      
      // Add some chaos factor that increases over time
      const chaosLevel = Math.min(freq - 1, 3); // Caps at 3 for max chaos
      const chaosNoise = Math.sin(angle * 3 + timeOffset * 2) * (chaosLevel * 15);
      const secondaryWave = Math.sin(angle * 0.5 + timeOffset * 0.3) * (chaosLevel * 10);
      
      const y = centerY + Math.sin(angle) * amplitude + chaosNoise + secondaryWave;
      points.push({ x, y });
    }
    
    return points;
  }, [width, waveLength, centerY, amplitude]);

  // Animation loop using useEffect
  useEffect(() => {
    if (!isClient) return;
    
    const interval = setInterval(() => {
      setTime(prevTime => {
        const newTime = prevTime + animationSpeed;
        
        // Increase frequency over time (every 3 seconds)
        const cycleTime = newTime * 60; // 60fps assumption
        const newFrequency = 1 + Math.floor(cycleTime / 180) * 0.5; // Increase every 3 seconds
        setFrequency(newFrequency);
        
        // Increase animation speed over time
        setAnimationSpeed(0.01 + Math.floor(cycleTime / 180) * 0.005);
        
        // Reset after 20 seconds
        if (cycleTime > 1200) { // 20 seconds at 60fps
          setFrequency(1);
          setAnimationSpeed(0.01);
          return 0;
        }
        
        return newTime;
      });
    }, 16); // ~60fps
    
    return () => clearInterval(interval);
  }, [animationSpeed, isClient]);

  // Update wave points and current dot position
  useEffect(() => {
    if (!isClient) return;
    
    const points = generateWavePoints(time, frequency);
    setWavePoints(points);
    
    // Calculate current dot position (moving along the wave)
    const progress = (time * 0.5) % 1;
    const dotIndex = Math.floor(progress * (points.length - 1));
    if (points[dotIndex]) {
      setCurrentDot(points[dotIndex]);
      
      // Update mood text based on wave position
      const normalizedY = (points[dotIndex].y - centerY) / amplitude;
      if (normalizedY > 0.3) {
        setMoodText("We're so back!");
      } else if (normalizedY < -0.3) {
        setMoodText("It's so over...");
      } else {
        setMoodText("Neutral vibes");
      }
    }
  }, [time, frequency, generateWavePoints, centerY, amplitude, isClient]);

  // Generate new random wave pattern
  const generateNewMood = () => {
    setTime(Math.random() * 10);
    setFrequency(0.5 + Math.random() * 2);
    setAnimationSpeed(0.01 + Math.random() * 0.02);
  };

  // Create SVG path from points
  const createPath = (points: WavePoint[]): string => {
    if (points.length === 0) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-neutral-100 flex flex-col items-center justify-center p-4">
        <div className="animate-pulse">
          <div className="w-96 h-8 bg-neutral-300 rounded mb-4"></div>
          <div className="w-80 h-64 bg-neutral-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-neutral-100 flex flex-col items-center justify-center p-4"
      animate={{ 
        backgroundColor: frequency > 2 ? "#f0f0f0" : "#f4f4f4" 
      }}
      transition={{ duration: 2 }}
    >
      {/* Main container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-4xl"
      >
        {/* Graph container */}
        <div className="relative bg-white rounded-lg shadow-sm border border-neutral-200 p-4 md:p-8 mb-8">
          {/* Y-axis labels */}
          <div className="absolute left-1 md:left-2 top-4 font-mono text-xs text-neutral-600 transform -rotate-90 origin-center whitespace-nowrap">
            We're so back
          </div>
          <div className="absolute left-1 md:left-2 bottom-4 font-mono text-xs text-neutral-600 transform -rotate-90 origin-center whitespace-nowrap">
            It's so over
          </div>
          
          {/* Graph title */}
          <h1 className="text-center text-xl md:text-2xl font-light text-neutral-800 mb-4 md:mb-6 px-8">
            Emotional Volatility Index
          </h1>
          
          {/* SVG Graph */}
          <div className="flex justify-center overflow-hidden">
            <svg 
              width={width} 
              height={height}
              className="border border-neutral-200 rounded max-w-full"
              style={{ background: '#fafafa' }}
              viewBox={`0 0 ${width} ${height}`}
            >
              {/* Grid lines */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e5e5" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Center line */}
              <line 
                x1="0" 
                y1={centerY} 
                x2={width} 
                y2={centerY} 
                stroke="#a3a3a3" 
                strokeWidth="1"
                strokeDasharray="5,5"
              />
              
              {/* Wave path */}
              <motion.path
                d={createPath(wavePoints)}
                fill="none"
                stroke="#404040"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5 }}
              />
              
              {/* Current position dot */}
              <motion.circle
                cx={currentDot.x}
                cy={currentDot.y}
                r="4"
                fill="#404040"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.7, 1]
                }}
                transition={{ 
                  duration: 0.8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </svg>
          </div>
          
          {/* Current mood indicator */}
          <motion.div 
            className="text-center mt-4 md:mt-6"
            key={moodText}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-base md:text-lg font-medium text-neutral-700 font-mono">
              {moodText}
            </p>
            <p className="text-xs md:text-sm text-neutral-500 mt-1">
              Frequency: {frequency.toFixed(1)}x | Speed: {(animationSpeed * 100).toFixed(1)}%
            </p>
          </motion.div>
        </div>
        
        {/* Generate button */}
        <div className="text-center">
          <motion.button
            onClick={generateNewMood}
            className="px-6 md:px-8 py-3 bg-neutral-800 text-white rounded-lg font-medium hover:bg-neutral-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 text-sm md:text-base"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Generate Mood
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
