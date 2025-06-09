'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SoundEngine from './components/SoundEngine';
import MoodHistory from './components/MoodHistory';
import ParticleSystem from './components/ParticleSystem';
import Toast from './components/Toast';

interface WavePoint {
  x: number;
  y: number;
}

interface MoodState {
  text: string;
  color: string;
  intensity: number;
  description: string;
}

type MoodType = 'euphoric' | 'optimistic' | 'neutral' | 'pessimistic' | 'despair';

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

// Mood configurations
const moodConfigs: Record<MoodType, MoodState> = {
  euphoric: {
    text: "We're absolutely SO BACK! 🚀",
    color: '#10b981',
    intensity: 0.9,
    description: 'Peak euphoria'
  },
  optimistic: {
    text: "We're so back! ✨",
    color: '#3b82f6',
    intensity: 0.6,
    description: 'Feeling optimistic'
  },
  neutral: {
    text: "Neutral vibes 😐",
    color: '#6b7280',
    intensity: 0.3,
    description: 'Balanced state'
  },
  pessimistic: {
    text: "It's kinda over... 😕",
    color: '#f59e0b',
    intensity: 0.6,
    description: 'Feeling pessimistic'
  },
  despair: {
    text: "It's SO over... 💀",
    color: '#ef4444',
    intensity: 0.9,
    description: 'Complete despair'
  }
};

export default function VibeGraph() {
  const [time, setTime] = useState(0);
  const [frequency, setFrequency] = useState(1);
  const [wavePoints, setWavePoints] = useState<WavePoint[]>([]);
  const [currentDot, setCurrentDot] = useState({ x: 0, y: 0 });
  const [currentMood, setCurrentMood] = useState<MoodType>('optimistic');
  const [animationSpeed, setAnimationSpeed] = useState(0.01);
  const [isClient, setIsClient] = useState(false);
  const [volatility, setVolatility] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showKeyboardHints, setShowKeyboardHints] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const [soundVolume, setSoundVolume] = useState(0.5);
  const [showMoodHistory, setShowMoodHistory] = useState(false);
  const [showParticles, setShowParticles] = useState(true);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);

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
    
    // Parse URL parameters for shared moods
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const moodParam = urlParams.get('mood');
      const freqParam = urlParams.get('freq');
      const volParam = urlParams.get('vol');
      
      if (moodParam && moodParam in moodConfigs) {
        setCurrentMood(moodParam as MoodType);
      }
      if (freqParam) {
        const freq = parseFloat(freqParam);
        if (!isNaN(freq) && freq > 0 && freq < 10) {
          setFrequency(freq);
        }
      }
      if (volParam) {
        const vol = parseFloat(volParam);
        if (!isNaN(vol) && vol >= 0 && vol <= 1) {
          setVolatility(vol);
        }
      }
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isClient) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          generateNewMood();
          break;
        case 'p':
          setIsPaused(prev => !prev);
          break;
        case 'r':
          resetAnimation();
          break;
        case '1':
          setPresetMood('euphoric');
          break;
        case '2':
          setPresetMood('optimistic');
          break;
        case '3':
          setPresetMood('neutral');
          break;
        case '4':
          setPresetMood('pessimistic');
          break;
        case '5':
          setPresetMood('despair');
          break;
        case '?':
          setShowKeyboardHints(prev => !prev);
          break;
        case 'm':
          setIsSoundEnabled(prev => !prev);
          break;
        case 'h':
          setShowMoodHistory(prev => !prev);
          break;
        case 'x':
          exportCurrentMood();
          break;
        case 'v':
          setShowParticles(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isClient]);

  // Generate wave points with enhanced chaos
  const generateWavePoints = useCallback((timeOffset: number, freq: number): WavePoint[] => {
    const points: WavePoint[] = [];
    const numPoints = 200;
    
    for (let i = 0; i <= numPoints; i++) {
      const x = (i / numPoints) * width;
      const angle = ((x / waveLength) * Math.PI * 2 * freq) + timeOffset;
      
      // Enhanced chaos calculation
      const chaosLevel = Math.min(freq - 1, 4);
      const chaosNoise = Math.sin(angle * 3 + timeOffset * 2) * (chaosLevel * 15);
      const secondaryWave = Math.sin(angle * 0.5 + timeOffset * 0.3) * (chaosLevel * 10);
      const tertiaryWave = Math.sin(angle * 7 + timeOffset * 5) * (chaosLevel * 5);
      
      const y = centerY + Math.sin(angle) * amplitude + chaosNoise + secondaryWave + tertiaryWave;
      points.push({ x, y });
    }
    
    return points;
  }, [width, waveLength, centerY, amplitude]);

  // Calculate volatility from wave points
  const calculateVolatility = useCallback((points: WavePoint[]): number => {
    if (points.length < 2) return 0;
    
    let totalVariation = 0;
    for (let i = 1; i < points.length; i++) {
      totalVariation += Math.abs(points[i].y - points[i - 1].y);
    }
    
    return Math.min(totalVariation / points.length / amplitude, 1);
  }, [amplitude]);

  // Determine mood based on wave position and volatility
  const determineMood = useCallback((waveY: number, volatilityLevel: number): MoodType => {
    const normalizedY = (waveY - centerY) / amplitude;
    
    if (volatilityLevel > 0.7) {
      return normalizedY > 0 ? 'euphoric' : 'despair';
    } else if (normalizedY > 0.4) {
      return 'optimistic';
    } else if (normalizedY < -0.4) {
      return 'pessimistic';
    } else {
      return 'neutral';
    }
  }, [centerY, amplitude]);

  // Animation loop
  useEffect(() => {
    if (!isClient || isPaused) return;
    
    const interval = setInterval(() => {
      setTime(prevTime => {
        const newTime = prevTime + animationSpeed;
        
        // Increase frequency over time (every 3 seconds)
        const cycleTime = newTime * 60;
        const newFrequency = 1 + Math.floor(cycleTime / 180) * 0.5;
        setFrequency(newFrequency);
        
        // Increase animation speed over time
        setAnimationSpeed(0.01 + Math.floor(cycleTime / 180) * 0.005);
        
        // Reset after 20 seconds
        if (cycleTime > 1200) {
          setFrequency(1);
          setAnimationSpeed(0.01);
          return 0;
        }
        
        return newTime;
      });
    }, 16);
    
    return () => clearInterval(interval);
  }, [animationSpeed, isClient, isPaused]);

  // Update wave points and mood
  useEffect(() => {
    if (!isClient) return;
    
    const points = generateWavePoints(time, frequency);
    setWavePoints(points);
    
    const volatilityLevel = calculateVolatility(points);
    setVolatility(volatilityLevel);
    
    // Calculate current dot position
    const progress = (time * 0.5) % 1;
    const dotIndex = Math.floor(progress * (points.length - 1));
    if (points[dotIndex]) {
      setCurrentDot(points[dotIndex]);
      const mood = determineMood(points[dotIndex].y, volatilityLevel);
      setCurrentMood(mood);
    }
  }, [time, frequency, generateWavePoints, calculateVolatility, determineMood, isClient]);

  // Utility functions
  const generateNewMood = () => {
    setTime(Math.random() * 10);
    setFrequency(0.5 + Math.random() * 2.5);
    setAnimationSpeed(0.01 + Math.random() * 0.02);
  };

  const resetAnimation = () => {
    setTime(0);
    setFrequency(1);
    setAnimationSpeed(0.01);
  };

  const setPresetMood = (mood: MoodType) => {
    const config = moodConfigs[mood];
    setTime(Math.random() * 5);
    setFrequency(1 + config.intensity * 2);
    setAnimationSpeed(0.01 + config.intensity * 0.015);
  };

  const exportCurrentMood = () => {
    const moodData = {
      timestamp: new Date().toISOString(),
      mood: currentMood,
      frequency,
      volatility,
      animationSpeed,
      wavePoints: wavePoints.slice(0, 50), // Export subset for size
      color: moodConfig.color
    };
    
    const dataStr = JSON.stringify(moodData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vibegraph-mood-${currentMood}-${new Date().getTime()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Mood data exported successfully!', 'success');
  };

  const exportMoodAsPNG = () => {
    const svg = document.querySelector('svg');
    if (!svg) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = width;
    canvas.height = height;
    
    const data = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(svgBlob);
    
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#fafafa';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0);
      
      // Add timestamp and mood info
      ctx.fillStyle = moodConfig.color;
      ctx.font = '14px monospace';
      ctx.fillText(`${currentMood.toUpperCase()} - ${new Date().toLocaleString()}`, 10, height - 10);
      
      canvas.toBlob(blob => {
        if (!blob) return;
        const pngUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `vibegraph-${currentMood}-${new Date().getTime()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(pngUrl);
        showToast('Mood image exported successfully!', 'success');
      });
      
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const shareCurrentMood = async () => {
    const moodUrl = `${window.location.origin}?mood=${currentMood}&freq=${frequency.toFixed(2)}&vol=${volatility.toFixed(2)}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `VibeGraph - ${moodConfig.text}`,
          text: `Check out my current mood: ${moodConfig.text}`,
          url: moodUrl
        });
      } catch (error) {
        console.log('Share failed:', error);
        copyToClipboard(moodUrl);
      }
    } else {
      copyToClipboard(moodUrl);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast({ message: 'Mood URL copied to clipboard!', type: 'success' });
    } catch (error) {
      console.log('Clipboard write failed:', error);
      setToast({ message: 'Failed to copy to clipboard', type: 'error' });
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  // Create SVG path
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
        <div className="shimmer rounded-lg mb-4 w-96 h-8"></div>
        <div className="shimmer rounded-lg w-80 h-64"></div>
      </div>
    );
  }

  const moodConfig = moodConfigs[currentMood];

  return (
    <motion.div 
      className="min-h-screen bg-neutral-100 flex flex-col items-center justify-center p-4 relative"
      animate={{ 
        backgroundColor: frequency > 2.5 ? "#f0f0f0" : "#f4f4f4" 
      }}
      transition={{ duration: 2 }}
    >
      {/* Keyboard Hints Modal */}
      <AnimatePresence>
        {showKeyboardHints && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowKeyboardHints(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass rounded-xl p-6 max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">⌨️ Keyboard Shortcuts</h3>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between">
                  <span>Space</span>
                  <span>Generate mood</span>
                </div>
                <div className="flex justify-between">
                  <span>P</span>
                  <span>Pause/Resume</span>
                </div>
                <div className="flex justify-between">
                  <span>R</span>
                  <span>Reset animation</span>
                </div>
                <div className="flex justify-between">
                  <span>1-5</span>
                  <span>Preset moods</span>
                </div>
                <div className="flex justify-between">
                  <span>?</span>
                  <span>Toggle this help</span>
                </div>
                <div className="flex justify-between">
                  <span>M</span>
                  <span>Toggle sound</span>
                </div>
                <div className="flex justify-between">
                  <span>H</span>
                  <span>Mood history</span>
                </div>
                <div className="flex justify-between">
                  <span>X</span>
                  <span>Export mood</span>
                </div>
                <div className="flex justify-between">
                  <span>V</span>
                  <span>Toggle particles</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control buttons */}
      <div className="fixed top-4 right-4 flex flex-col space-y-2 z-40">
        <motion.button
          onClick={() => setShowKeyboardHints(true)}
          className="w-10 h-10 bg-neutral-800 text-white rounded-full flex items-center justify-center hover:bg-neutral-700 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Help (? key)"
        >
          ?
        </motion.button>
        
        <motion.button
          onClick={() => setIsSoundEnabled(prev => !prev)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            isSoundEnabled 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-neutral-300 hover:bg-neutral-400 text-neutral-700'
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Toggle sound (M key)"
        >
          {isSoundEnabled ? '🔊' : '🔇'}
        </motion.button>
        
        <motion.button
          onClick={() => setShowMoodHistory(true)}
          className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Mood history (H key)"
        >
          📊
        </motion.button>
      </div>

      {/* Main container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-5xl"
      >
        {/* Enhanced Header */}
        <motion.div className="text-center mb-8">
          <motion.h1 
            className="text-3xl md:text-4xl font-extralight tracking-tight text-neutral-800 mb-2"
            animate={{ color: moodConfig.color }}
            transition={{ duration: 0.5 }}
          >
            Emotional Volatility Index
          </motion.h1>
          <p className="text-sm text-neutral-500 mb-4">Real-time mood visualization</p>
          
          {/* Volatility Meter */}
          <div className="flex items-center justify-center space-x-3 mb-4">
            <span className="text-xs font-mono text-neutral-600">Stability</span>
            <div className="w-32 h-2 bg-neutral-200 rounded-full overflow-hidden">
              <motion.div 
                className="h-full rounded-full"
                style={{ 
                  background: `linear-gradient(to right, ${moodConfigs.optimistic.color}, ${moodConfigs.despair.color})`
                }}
                animate={{ width: `${volatility * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-xs font-mono text-neutral-600">Chaos</span>
          </div>
        </motion.div>

        {/* Graph container with glassmorphism */}
        <div className="relative glass rounded-xl shadow-lg p-4 md:p-8 mb-8">
          {/* Y-axis labels */}
          <div className="absolute left-1 md:left-2 top-4 font-mono text-xs text-neutral-600 transform -rotate-90 origin-center whitespace-nowrap">
            We're so back
          </div>
          <div className="absolute left-1 md:left-2 bottom-4 font-mono text-xs text-neutral-600 transform -rotate-90 origin-center whitespace-nowrap">
            It's so over
          </div>
          
          {/* SVG Graph */}
          <div className="flex justify-center overflow-hidden relative">
            <svg 
              width={width} 
              height={height}
              className="border border-neutral-200 rounded-lg max-w-full"
              style={{ background: '#fafafa' }}
              viewBox={`0 0 ${width} ${height}`}
            >
              {/* Enhanced grid */}
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e5e5" strokeWidth="0.5"/>
                </pattern>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
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
              
              {/* Wave path with mood-based color */}
              <motion.path
                d={createPath(wavePoints)}
                fill="none"
                stroke={moodConfig.color}
                strokeWidth="2.5"
                filter="url(#glow)"
                initial={{ pathLength: 0 }}
                animate={{ 
                  pathLength: 1,
                  stroke: moodConfig.color
                }}
                transition={{ duration: 0.5 }}
              />
              
                             {/* Current position dot with pulse effect */}
               <motion.circle
                 cx={currentDot.x}
                 cy={currentDot.y}
                 r="5"
                 fill={moodConfig.color}
                 filter="url(#glow)"
                 animate={{ 
                   scale: [1, 1.3, 1],
                   opacity: [1, 0.7, 1],
                   fill: moodConfig.color
                 }}
                 transition={{ 
                   duration: 1,
                   repeat: Infinity,
                   ease: "easeInOut"
                 }}
               />
             </svg>
             
             {/* Particle System Overlay */}
             <ParticleSystem
               dotX={currentDot.x}
               dotY={currentDot.y}
               intensity={volatility}
               color={moodConfig.color}
               isActive={showParticles && volatility > 0.3}
             />
           </div>
          
          {/* Enhanced mood indicator */}
          <motion.div 
            className="text-center mt-4 md:mt-6"
            key={currentMood}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.p 
              className="text-lg md:text-xl font-medium font-mono mb-1"
              animate={{ color: moodConfig.color }}
              transition={{ duration: 0.3 }}
            >
              {moodConfig.text}
            </motion.p>
            <p className="text-sm text-neutral-500 mb-2">{moodConfig.description}</p>
            <div className="flex justify-center space-x-4 text-xs font-mono text-neutral-400">
              <span>Frequency: {frequency.toFixed(1)}x</span>
              <span>Speed: {(animationSpeed * 100).toFixed(1)}%</span>
              <span>Volatility: {(volatility * 100).toFixed(0)}%</span>
            </div>
          </motion.div>
        </div>
        
        {/* Enhanced control buttons */}
        <div className="flex flex-wrap justify-center gap-3">
          <motion.button
            onClick={generateNewMood}
            className="px-6 md:px-8 py-3 bg-neutral-800 text-white rounded-lg font-medium hover:bg-neutral-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 text-sm md:text-base"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            🎲 Generate Mood
          </motion.button>
          
          <motion.button
            onClick={() => setIsPaused(prev => !prev)}
            className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 text-sm md:text-base ${
              isPaused 
                ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500' 
                : 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isPaused ? '▶️ Resume' : '⏸️ Pause'}
          </motion.button>
          
          <motion.button
            onClick={resetAnimation}
            className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm md:text-base"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            🔄 Reset
          </motion.button>
          
          <motion.button
            onClick={shareCurrentMood}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 text-sm md:text-base"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            📱 Share Mood
          </motion.button>
          
          <motion.button
            onClick={exportMoodAsPNG}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-sm md:text-base"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            📸 Export PNG
          </motion.button>
        </div>

        {/* Preset mood buttons */}
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {(Object.keys(moodConfigs) as MoodType[]).map((mood, index) => (
            <motion.button
              key={mood}
              onClick={() => setPresetMood(mood)}
              className="px-3 py-1 text-xs rounded-full border-2 transition-all duration-200 font-mono"
              style={{ 
                borderColor: moodConfigs[mood].color,
                color: currentMood === mood ? 'white' : moodConfigs[mood].color,
                backgroundColor: currentMood === mood ? moodConfigs[mood].color : 'transparent'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {index + 1}. {moodConfigs[mood].description}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Sound Engine */}
      <SoundEngine
        frequency={frequency}
        mood={currentMood}
        volatility={volatility}
        isEnabled={isSoundEnabled}
        volume={soundVolume}
      />

      {/* Mood History Modal */}
      <MoodHistory
        currentMood={currentMood}
        frequency={frequency}
        volatility={volatility}
        moodColor={moodConfig.color}
        isVisible={showMoodHistory}
        onClose={() => setShowMoodHistory(false)}
      />

      {/* Toast Notifications */}
      <Toast
        message={toast?.message || ''}
        type={toast?.type || 'info'}
        isVisible={!!toast}
        onClose={() => setToast(null)}
      />
    </motion.div>
  );
}
