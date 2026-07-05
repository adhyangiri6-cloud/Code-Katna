import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

export default function CyberGrid() {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; duration: number }>>([]);

  useEffect(() => {
    // Generate static list of particles for ambient neon floaters
    const generated = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 20 + 10,
    }));
    setParticles(generated);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0 bg-[#fdfdfd]">
      {/* Base Cyber/Manga Grid Overlay */}
      <div className="absolute inset-0 cyber-grid opacity-40" />
      
      {/* Manga halftone overlay for a print look */}
      <div className="absolute inset-0 manga-screentone opacity-[0.06]" />

      {/* Extreme Shonen Speedlines at the edges */}
      <div className="absolute inset-0 manga-speedlines opacity-5" />
      
      {/* Anime Glowing Spiritual Aura */}
      <div className="absolute bottom-0 left-0 right-0 h-[500px] bg-gradient-to-t from-shonen-orange/5 via-shonen-orange/2 to-transparent opacity-40 blur-3xl" />
      <div className="absolute top-0 left-1/4 right-1/4 h-80 bg-gradient-to-b from-shonen-orange/5 to-transparent opacity-30 blur-2xl" />

      {/* Shonen Clash Divider Stripe */}
      <div className="absolute top-[80px] left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-shonen-orange/30 to-transparent" />
      
      {/* CRT / Scanline filter for manga page feel */}
      <div className="absolute inset-0 scanlines opacity-[0.02] z-10" />

      {/* Floating chakra/spiritual embers of orange and warm gold hues */}
      {particles.map((p, idx) => {
        const colors = [
          'rgba(255, 107, 0, 0.55)', // Shonen Orange
          'rgba(255, 150, 0, 0.45)', // Warm Gold
          'rgba(255, 90, 0, 0.5)',   // Hot Orange
        ];
        const color = colors[idx % colors.length];
        const shadow = `0 0 10px ${color}`;

        return (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size + (idx % 2 === 0 ? 2 : 0)}px`,
              height: `${p.size + (idx % 2 === 0 ? 2 : 0)}px`,
              backgroundColor: color,
              boxShadow: shadow,
            }}
            animate={{
              y: ['0px', '-150px', '0px'],
              x: ['0px', (idx % 2 === 0 ? '15px' : '-15px'), '0px'],
              opacity: [0.2, 0.8, 0.2],
              rotate: [0, 360],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        );
      })}

      {/* Extreme manga-panel slanted borders */}
      <div 
        className="absolute -top-[10%] -left-[10%] w-[35%] h-[120%] bg-gradient-to-br from-gray-100 to-transparent opacity-70 transform -rotate-12 pointer-events-none border-r border-black/10"
        style={{ clipPath: 'polygon(0 0, 100% 0, 75% 100%, 0% 100%)' }}
      />
      <div 
        className="absolute -bottom-[10%] -right-[10%] w-[30%] h-[120%] bg-gradient-to-tl from-gray-100 to-transparent opacity-65 transform -rotate-12 pointer-events-none border-l border-black/10"
        style={{ clipPath: 'polygon(25% 0, 100% 0, 100% 100%, 0% 100%)' }}
      />
    </div>
  );
}
