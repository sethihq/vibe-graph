'use client';

import { useState, useEffect, useCallback } from 'react';

interface WavePoint {
  x: number;
  y: number;
}

export default function VibeGraph() {
  const [time, setTime] = useState(0);
  const [frequency, setFrequency] = useState(1);
  const [wavePoints, setWavePoints] = useState<WavePoint[]>([]);
  const [currentDot, setCurrentDot] = useState({ x: 0, y: 0 });
  const [animationSpeed, setAnimationSpeed] = useState(0.01);
  const [isPaused, setIsPaused] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // Terminal dimensions optimized for retro display
  const width = 800;
  const height = 280;
  const centerY = height / 2;
  const amplitude = 100;

  // Wave generation with optimized performance
  const generateWavePoints = useCallback((time: number, freq: number): WavePoint[] => {
    const points: WavePoint[] = [];
    const numPoints = 200;
    
    for (let i = 0; i < numPoints; i++) {
      const x = (i / (numPoints - 1)) * width;
      const phase = (i / numPoints) * Math.PI * 2 * freq + time;
      const wave = Math.sin(phase);
      const y = centerY + wave * amplitude;
      points.push({ x, y });
    }
    
    return points;
  }, [width, centerY, amplitude]);

  // Initialize client-side rendering and start clock
  useEffect(() => {
    setIsClient(true);
    
    // Update clock every second
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    };
    
    updateClock(); // Initial call
    const clockInterval = setInterval(updateClock, 1000);
    
    return () => clearInterval(clockInterval);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          generateMood();
          break;
        case 'p':
          setIsPaused(prev => !prev);
          break;
        case 'r':
          reset();
          break;
      }
    };

    if (isClient) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [isClient]);

  // Optimized animation loop using requestAnimationFrame
  useEffect(() => {
    if (!isClient || isPaused) return;
    
    let frameId: number;
    
    const animate = () => {
      setTime(prevTime => {
        const newTime = prevTime + animationSpeed;
        
        // Auto-progression with chaos buildup
        const cycleTime = newTime * 60;
        if (cycleTime < 1800) { // 30 seconds
          const chaosLevel = Math.floor(cycleTime / 180);
          setFrequency(1 + chaosLevel * 0.3);
          setAnimationSpeed(0.01 + chaosLevel * 0.003);
        } else {
          // Reset cycle
          setFrequency(1);
          setAnimationSpeed(0.01);
          return 0;
        }
        
        return newTime;
      });
      
      frameId = requestAnimationFrame(animate);
    };
    
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [animationSpeed, isClient, isPaused]);

  // Update wave points and dot position
  useEffect(() => {
    if (!isClient) return;
    
    const points = generateWavePoints(time, frequency);
    setWavePoints(points);
    
    // Update dot position with smoother movement
    const progress = (time * 0.3) % 1;
    const dotIndex = Math.floor(progress * (points.length - 1));
    if (points[dotIndex]) {
      setCurrentDot(points[dotIndex]);
    }
  }, [time, frequency, generateWavePoints, isClient]);

  // Core functions
  const generateMood = () => {
    setTime(Math.random() * 10);
    setFrequency(0.5 + Math.random() * 2.5);
    setAnimationSpeed(0.005 + Math.random() * 0.02);
  };

  const reset = () => {
    setTime(0);
    setFrequency(1);
    setAnimationSpeed(0.01);
  };

  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

  // Optimized path creation
  const createPath = (points: WavePoint[]): string => {
    if (points.length === 0) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
  };

  // Terminal-style mood determination
  const getCurrentState = () => {
    const normalizedY = (currentDot.y - centerY) / amplitude;
    if (normalizedY > 0.5) return "SYSTEM_CRITICAL > IT'S_SO_OVER";
    if (normalizedY < -0.5) return "OPTIMIZING > WE'RE_SO_BACK";
    return "STABLE > EMOTIONAL_EQUILIBRIUM";
  };

  // Calculate volatility for metrics
  const calculateVolatility = (points: WavePoint[]): number => {
    if (points.length < 2) return 0;
    
    let totalVariation = 0;
    for (let i = 1; i < points.length; i++) {
      totalVariation += Math.abs(points[i].y - points[i-1].y);
    }
    
    const avgVariation = totalVariation / (points.length - 1);
    return Math.min(avgVariation / (amplitude * 0.5), 1);
  };

  if (!isClient) {
    return (
      <div className="terminal-screen">
        <div className="terminal-header">
          <div className="flex items-center gap-3">
            <div className="status-dot"></div>
            <span className="text-header">VIBEGRAPH_TERMINAL_v2.1</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-dim">INITIALIZING...</span>
          </div>
        </div>
        <div className="terminal-body">
          <div className="text-body">LOADING_SYSTEMS...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="terminal-screen">
      {/* Terminal Header */}
      <div className="terminal-header">
        <div className="flex items-center gap-3">
          <div className="status-dot"></div>
          <span className="text-header">VIBEGRAPH_TERMINAL_v2.1</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-dim">SESSION_ACTIVE</span>
          <span className="text-dim">|</span>
          <span className="text-dim">{currentTime || 'READY'}</span>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="terminal-body">
        {/* Current State Display */}
        <div className="text-center mb-6">
          <div className="text-title mb-2">
            {getCurrentState()}<span className="cursor"></span>
          </div>
          <div className="text-body text-dim">
            REAL_TIME_EMOTIONAL_VOLATILITY_MONITORING
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="metrics-grid">
          <div className="metric-card">
            <span className="metric-value">{frequency.toFixed(2)}</span>
            <span className="metric-label">FREQ_HZ</span>
          </div>
          <div className="metric-card">
            <span className="metric-value">{(animationSpeed * 1000).toFixed(1)}</span>
            <span className="metric-label">SPEED_MS</span>
          </div>
          <div className="metric-card">
            <span className="metric-value">{(calculateVolatility(wavePoints) * 100).toFixed(0)}%</span>
            <span className="metric-label">VOLATILITY</span>
          </div>
          <div className="metric-card">
            <span className="metric-value">{isPaused ? 'PAUSED' : 'ACTIVE'}</span>
            <span className="metric-label">STATUS</span>
          </div>
        </div>
        
        {/* Wave Chart */}
        <div className="chart-container">
          <svg 
            width={width} 
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full"
          >
            {/* Center reference line */}
            <line 
              x1="0" 
              y1={centerY} 
              x2={width} 
              y2={centerY} 
              stroke="var(--text-dim)"
              strokeWidth="1"
              strokeDasharray="4,4"
              opacity="0.5"
            />
            
            {/* Wave path */}
            <path
              d={createPath(wavePoints)}
              className="wave-path"
            />
            
            {/* Current position dot */}
            <circle
              cx={currentDot.x}
              cy={currentDot.y}
              r="4"
              className="wave-dot"
            />
            
            {/* Glow ring around dot */}
            <circle
              cx={currentDot.x}
              cy={currentDot.y}
              r="8"
              fill="none"
              stroke="var(--text-primary)"
              strokeWidth="1"
              opacity="0.3"
            />
          </svg>
        </div>
      </div>

      {/* Floating Command Menu */}
      <div className="floating-menu">
        <div className="menu-title">COMMANDS</div>
        
        <button onClick={generateMood} className="btn-menu">
          GENERATE
        </button>
        
        <button onClick={togglePause} className="btn-menu">
          {isPaused ? 'RESUME' : 'PAUSE'}
        </button>
        
        <button onClick={reset} className="btn-menu">
          RESET
        </button>
        
        <div className="menu-title" style={{ marginTop: '12px', marginBottom: '4px' }}>
          KEYS
        </div>
        
        <div className="text-dim" style={{ fontSize: '9px', textAlign: 'center' }}>
          SPACE: Generate<br/>
          P: Pause<br/>
          R: Reset
        </div>
      </div>
    </div>
  );
}
