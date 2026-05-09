'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { playClick } from '@/lib/audio';

interface LoginButtonProps {
  className?: string;
}

export function LoginButton({ className }: LoginButtonProps) {
  return (
    <motion.button
      onClick={() => { playClick(); api.loginWithGoogle(); }}
      whileHover={{ scale: 1.04, y: -1 }}
      whileTap={{ scale: 0.97, y: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 22 }}
      className={
        className ??
        [
          'group relative inline-flex items-center justify-center gap-3',
          'bg-accent hover:bg-accent-hover text-background',
          'font-bold text-sm tracking-widest uppercase',
          'px-10 py-4 rounded-xl transition-colors duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'shadow-gold-md hover:shadow-gold-lg overflow-hidden',
        ].join(' ')
      }
    >
      {/* Shimmer effect */}
      <span
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)',
        }}
        aria-hidden="true"
      />

      {/* Google G mark */}
      <span
        className="relative w-5 h-5 bg-white rounded-full flex items-center justify-center text-xs font-black text-[#4285F4] shrink-0"
        aria-hidden="true"
      >
        G
      </span>
      <span className="relative">Sign in with Google</span>
    </motion.button>
  );
}
