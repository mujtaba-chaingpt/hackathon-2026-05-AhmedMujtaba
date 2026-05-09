'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface CountdownTimerProps {
  expiresAt: string;
  onExpire: () => void;
}

function getRemainingSeconds(expiresAt: string): number {
  const expMs = new Date(expiresAt).getTime();
  const nowMs = Date.now();
  return Math.max(0, Math.floor((expMs - nowMs) / 1000));
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function CountdownTimer({ expiresAt, onExpire }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState<number>(() => getRemainingSeconds(expiresAt));
  const [expired, setExpired] = useState(false);
  const prevSecondsRef = useRef<number | null>(null);

  const tick = useCallback(() => {
    const secs = getRemainingSeconds(expiresAt);
    setRemaining(secs);
    if (secs <= 0 && !expired) {
      setExpired(true);
      onExpire();
    }
  }, [expiresAt, expired, onExpire]);

  useEffect(() => {
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [tick]);

  const isUrgent = remaining <= 120;
  const isWarning = remaining <= 300 && remaining > 120;

  // Seconds digit for flip animation
  const seconds = remaining % 60;
  const secondsChanged = prevSecondsRef.current !== seconds;
  if (secondsChanged) prevSecondsRef.current = seconds;

  return (
    <motion.div
      animate={isUrgent && !expired ? {
        scale: [1, 1.04, 1],
        transition: { duration: 0.5, repeat: Infinity }
      } : {}}
      className={twMerge(
        'flex items-center gap-2 font-mono text-sm font-bold tracking-widest px-3 py-2 rounded-lg border transition-all duration-500',
        expired
          ? 'text-danger-bright border-danger/60 bg-danger/10 shadow-crimson-sm'
          : isUrgent
            ? 'text-red-400 border-danger/50 bg-danger/8 shadow-[0_0_15px_rgba(155,34,38,0.2)]'
            : isWarning
              ? 'text-amber-400 border-amber-700/40 bg-amber-950/15'
              : 'text-accent border-border-bright/40 bg-surface-2',
      )}
      aria-live="polite"
      aria-label={`Time remaining: ${formatTime(remaining)}`}
    >
      <motion.div
        animate={isUrgent && !expired ? { rotate: [-5, 5, -5, 5, 0] } : {}}
        transition={{ duration: 0.3, repeat: isUrgent ? Infinity : 0, repeatDelay: 0.7 }}
      >
        <Clock size={13} />
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.span
          key={expired ? 'expired' : formatTime(remaining)}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.15 }}
          className="tabular-nums"
        >
          {expired ? "TIME'S UP" : formatTime(remaining)}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
}
