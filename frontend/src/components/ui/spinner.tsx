'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

export function Spinner({ className, size = 'md' }: SpinnerProps) {
  return (
    <motion.span
      role="status"
      aria-label="Loading"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
      className={twMerge(
        'inline-block rounded-full border-2 border-accent/20 border-t-accent',
        sizeClasses[size],
        className,
      )}
    />
  );
}

export function FullPageSpinner() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 flex items-center justify-center bg-background z-50"
    >
      <div className="flex flex-col items-center gap-5">
        {/* Ornate spinner */}
        <div className="relative w-14 h-14">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-1.5 rounded-full border border-transparent border-t-accent/40"
          />
          <div className="absolute inset-0 flex items-center justify-center text-accent/60 text-xl">
            ☠
          </div>
        </div>

        <motion.p
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-muted font-mono text-xs tracking-[0.4em] uppercase"
        >
          Loading...
        </motion.p>
      </div>
    </motion.div>
  );
}
