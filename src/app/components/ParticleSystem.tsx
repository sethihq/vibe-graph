'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface ParticleSystemProps {
  dotX: number;
  dotY: number;
  intensity: number;
  color: string;
  isActive: boolean;
}

export default function ParticleSystem({ 
  dotX, 
  dotY, 
  intensity, 
  color, 
  isActive 
}: ParticleSystemProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [nextId, setNextId] = useState(0);

  // Generate particles
  useEffect(() => {
    if (!isActive || intensity < 0.1) return;

    const interval = setInterval(() => {
      const particleCount = Math.floor(intensity * 5); // More particles for higher intensity
      
      setParticles(prev => {
        const newParticles: Particle[] = [];
        
        // Create new particles
        for (let i = 0; i < particleCount; i++) {
          newParticles.push({
            id: nextId + i,
            x: dotX + (Math.random() - 0.5) * 20,
            y: dotY + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 0,
            maxLife: 60 + Math.random() * 60, // 1-2 seconds at 60fps
            size: 2 + Math.random() * 3,
            color: color
          });
        }
        
        // Update existing particles
        const updatedParticles = prev
          .map(particle => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            life: particle.life + 1,
            vy: particle.vy + 0.05, // Gravity effect
          }))
          .filter(particle => particle.life < particle.maxLife);
        
        setNextId(prev => prev + particleCount);
        return [...updatedParticles, ...newParticles];
      });
    }, 100); // Generate particles every 100ms

    return () => clearInterval(interval);
  }, [dotX, dotY, intensity, color, isActive, nextId]);

  if (!isActive || particles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: Math.max(0, 1 - (particle.life / particle.maxLife)),
            scale: 1 - (particle.life / particle.maxLife) * 0.5,
          }}
          transition={{ duration: 0.1 }}
        />
      ))}
    </div>
  );
} 