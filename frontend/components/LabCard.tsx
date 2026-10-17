'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface LabCardProps {
  level: number;
  title: string;
  category: string;
  points: number;
  slug: string;
  solved: boolean;
}

export default function LabCard({ level, title, category, points, slug, solved }: LabCardProps) {
  return (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      className={`relative p-5 rounded-lg border transition-all duration-300 flex flex-col justify-between ${
        solved 
          ? 'bg-black/90 border-matrix-green shadow-[0_0_15px_rgba(0,255,65,0.25)]' 
          : 'bg-black/80 border-matrix-green/30 hover:border-matrix-light'
      }`}
    >
      <div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-mono text-matrix-light uppercase tracking-wider font-bold">
            LEVEL {level}
          </span>
          {solved && (
            <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-matrix-green text-black shadow-[0_0_8px_#00ff41]">
              ✓ PWNED
            </span>
          )}
        </div>

        <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 leading-snug">
          {title}
        </h3>
        <p className="text-xs text-gray-400 font-mono mb-4">
          {category}
        </p>
      </div>

      <div className="pt-3 border-t border-matrix-green/20 flex justify-between items-center font-mono">
        <span className="text-xs text-matrix-green font-bold tracking-wider">
          {points} PTS
        </span>
        <Link 
          href={`/labs/${slug}`}
          className={`text-xs font-bold transition-colors ${
            solved 
              ? 'text-gray-300 hover:text-matrix-green' 
              : 'text-matrix-light hover:text-white'
          }`}
        >
          {solved ? 'REVIEW LAB →' : 'INITIALIZE LAB →'}
        </Link>
      </div>
    </motion.div>
  );
}
