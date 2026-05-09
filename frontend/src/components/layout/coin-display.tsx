'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

interface CoinDisplayProps {
  amount: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

export function CoinDisplay({ amount, className, size = 'md', animate: doAnimate = false }: CoinDisplayProps) {
  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-2xl font-black',
  };
  const iconSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-2xl',
  };

  return (
    <motion.span
      className={twMerge(
        'inline-flex items-center gap-1.5 text-accent font-mono font-bold',
        textSizes[size],
        className,
      )}
      whileHover={doAnimate ? { scale: 1.05 } : {}}
    >
      <motion.span
        className={twMerge('leading-none select-none', iconSizes[size])}
        animate={doAnimate ? { rotate: [0, 360] } : {}}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        aria-hidden="true"
      >
        ⊙
      </motion.span>
      <span className="tabular-nums tracking-wider">{amount.toLocaleString()}</span>
    </motion.span>
  );
}
