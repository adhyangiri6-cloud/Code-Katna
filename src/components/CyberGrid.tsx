import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

export default function CyberGrid() {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; duration: number; symbol: string }>>([]);

  useEffect(() => {
    const symbols = ['🌸', '✨', '💖', '⭐', '🍓', '🍡', '🎀'];
    const generated = Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 10 + 12,
      duration: Math.random() * 15 + 10,
      symbol: symbols[i % symbols.length]
    }));
    setParticles(generated);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0 bg-[#FFFDF9]">
      {/* Soft Pastel Cloud Glows */}
      <div className="absolute top-0 left-10 w-96 h-96 bg-pink-200/35 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[450px] h-[450px] bg-purple-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-[500px] h-[500px] bg-amber-100/40 rounded-full blur-3xl pointer-events-none" />

      {/* Cute Floating Micro-Icons (Sakura, Stars, Hearts, Strawberries) */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute select-none opacity-40 hover:opacity-80 transition-opacity"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: `${p.size}px`,
          }}
          animate={{
            y: ['0px', '-90px', '0px'],
            x: ['0px', p.id % 2 === 0 ? '25px' : '-25px', '0px'],
            rotate: [0, 20, -20, 0],
            scale: [0.9, 1.15, 0.9],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {p.symbol}
        </motion.div>
      ))}

      {/* Delicate Sweet Top Border Glow */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-300 via-rose-300 to-amber-200 opacity-60" />
    </div>
  );
}
