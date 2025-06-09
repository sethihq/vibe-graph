'use client';

import { useEffect, useRef, useState } from 'react';

interface SoundEngineProps {
  frequency: number;
  mood: string;
  volatility: number;
  isEnabled: boolean;
  volume: number;
}

export default function SoundEngine({ 
  frequency, 
  mood, 
  volatility, 
  isEnabled, 
  volume 
}: SoundEngineProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize audio context
  useEffect(() => {
    if (!isEnabled || isInitialized) return;

    const initializeAudio = async () => {
      try {
        audioContextRef.current = new AudioContext();
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.connect(audioContextRef.current.destination);
        gainNodeRef.current.gain.setValueAtTime(0, audioContextRef.current.currentTime);
        setIsInitialized(true);
      } catch (error) {
        console.log('Audio initialization failed:', error);
      }
    };

    initializeAudio();

    return () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isEnabled, isInitialized]);

  // Update sound based on mood and frequency
  useEffect(() => {
    if (!isEnabled || !isInitialized || !audioContextRef.current || !gainNodeRef.current) return;

    // Clean up previous oscillator
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
    }

    // Create new oscillator
    const oscillator = audioContextRef.current.createOscillator();
    const filter = audioContextRef.current.createBiquadFilter();
    
    // Connect audio nodes
    oscillator.connect(filter);
    filter.connect(gainNodeRef.current);
    
    // Configure oscillator based on mood
    const baseFreq = getMoodFrequency(mood);
    const modulatedFreq = baseFreq + (frequency - 1) * 50;
    
    oscillator.frequency.setValueAtTime(modulatedFreq, audioContextRef.current.currentTime);
    oscillator.type = getMoodWaveType(mood);
    
    // Configure filter based on volatility
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000 + volatility * 2000, audioContextRef.current.currentTime);
    filter.Q.setValueAtTime(1 + volatility * 10, audioContextRef.current.currentTime);
    
    // Set volume
    const targetVolume = volume * 0.1; // Keep it subtle
    gainNodeRef.current.gain.setValueAtTime(targetVolume, audioContextRef.current.currentTime);
    
    // Start oscillator
    oscillator.start();
    oscillatorRef.current = oscillator;

    // Clean up after 5 seconds to prevent audio artifacts
    setTimeout(() => {
      if (oscillatorRef.current === oscillator) {
        gainNodeRef.current?.gain.exponentialRampToValueAtTime(
          0.001, 
          audioContextRef.current!.currentTime + 0.1
        );
        setTimeout(() => {
          oscillator.stop();
          oscillator.disconnect();
        }, 100);
      }
    }, 5000);

  }, [frequency, mood, volatility, volume, isEnabled, isInitialized]);

  return null; // This component doesn't render anything
}

// Helper functions
function getMoodFrequency(mood: string): number {
  const frequencies: Record<string, number> = {
    euphoric: 440,    // A4 - energetic
    optimistic: 329,  // E4 - uplifting
    neutral: 261,     // C4 - balanced
    pessimistic: 196, // G3 - contemplative
    despair: 146,     // D3 - somber
  };
  return frequencies[mood] || 261;
}

function getMoodWaveType(mood: string): OscillatorType {
  const waveTypes: Record<string, OscillatorType> = {
    euphoric: 'sawtooth',    // Bright and energetic
    optimistic: 'triangle',  // Warm and pleasant
    neutral: 'sine',         // Pure and simple
    pessimistic: 'square',   // Hollow and contemplative
    despair: 'sine',         // Deep and pure
  };
  return waveTypes[mood] || 'sine';
} 