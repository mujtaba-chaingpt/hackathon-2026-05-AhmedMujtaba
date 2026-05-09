'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { useAudio } from '@/lib/audio-context';
import { api } from '@/lib/api';
import { FullPageSpinner } from '@/components/ui/spinner';
import { CoinDisplay } from '@/components/layout/coin-display';
import { Button } from '@/components/ui/button';
import type { Difficulty } from '@/lib/types';
import { DIFFICULTY_INFO } from '@/lib/types';
import { AlertTriangle, Clock, Users } from 'lucide-react';

// ── Tilt card with 3D perspective ───────────────────────────────────────────
function TiltCard({
  children,
  className,
  disabled,
}: {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-60, 60], [8, -8]);
  const rotateY = useTransform(x, [-60, 60], [-8, 8]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return;
      const rect = ref.current!.getBoundingClientRect();
      x.set(e.clientX - rect.left - rect.width / 2);
      y.set(e.clientY - rect.top - rect.height / 2);
    },
    [disabled, x, y],
  );

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.div
      ref={ref}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Difficulty card config ────────────────────────────────────────────────────
const CARD_CONFIG = {
  easy: {
    accentText: 'text-success-bright',
    accentBorder: 'border-success/30 hover:border-success/60',
    accentBg: 'bg-success/8',
    accentGlow: 'hover:shadow-[0_0_30px_rgba(39,174,96,0.12)]',
    badge: 'bg-success/10 border-success/25 text-success-bright',
    bullet: 'bg-success-bright/50',
    buttonVariant: 'outline' as const,
    lines: [
      'Three suspects, each with glaring contradictions.',
      'Designed for new detectives finding their footing.',
      'A short, sharp investigation session.',
    ],
  },
  medium: {
    accentText: 'text-accent',
    accentBorder: 'border-accent/30 hover:border-accent/60',
    accentBg: 'bg-accent/5',
    accentGlow: 'hover:shadow-[0_0_30px_rgba(201,162,39,0.15)]',
    badge: 'bg-accent/10 border-accent/25 text-accent',
    bullet: 'bg-accent/60',
    buttonVariant: 'default' as const,
    lines: [
      'Four suspects with overlapping alibis.',
      'Requires cross-referencing testimonies carefully.',
      'For detectives with a sharp eye for detail.',
    ],
  },
  hard: {
    accentText: 'text-danger-bright',
    accentBorder: 'border-danger/30 hover:border-danger/60',
    accentBg: 'bg-danger/5',
    accentGlow: 'hover:shadow-[0_0_30px_rgba(192,57,43,0.15)]',
    badge: 'bg-danger/10 border-danger/25 text-danger-bright',
    bullet: 'bg-danger-bright/50',
    buttonVariant: 'destructive' as const,
    lines: [
      'Six suspects, red herrings, and buried motives.',
      'The truth is layered beneath webs of deception.',
      'Only the most seasoned detectives prevail.',
    ],
  },
};

// ── Cinematic case-generating overlay ────────────────────────────────────────
const GENERATION_STEPS = [
  'Profiling victim identity...',
  'Assembling suspect dossiers...',
  'Planting evidence at crime scene...',
  'Weaving alibis and contradictions...',
  'Sealing the case file...',
];

function CaseGeneratingScreen({ difficulty }: { difficulty: Difficulty }) {
  return (
    <motion.div
      key="case-generating"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        background: 'rgba(4,4,6,0.97)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Noise grain overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-md px-8">
        {/* Animated title */}
        <div className="flex flex-col items-center gap-3">
          <motion.p
            className="font-mono text-[9px] tracking-[0.6em] uppercase text-foreground/30"
            initial={{ opacity: 0, letterSpacing: '0.3em' }}
            animate={{ opacity: 1, letterSpacing: '0.6em' }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            classified
          </motion.p>

          <motion.h1
            className="font-mono text-2xl sm:text-3xl tracking-widest uppercase text-center leading-tight"
            style={{ color: '#c9a227' }}
            animate={{ opacity: [1, 0.85, 1, 0.9, 1] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            initial={{ opacity: 0, y: 10 }}
          >
            {'GENERATING\nMURDER FILE'}
          </motion.h1>

          {/* Difficulty badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="border border-danger/60 rounded px-4 py-1 font-mono text-[10px] tracking-[0.4em] uppercase text-danger/90"
          >
            &#9670; {difficulty.toUpperCase()} CASE
          </motion.div>
        </div>

        {/* Divider line */}
        <motion.div
          className="w-full h-px"
          style={{ background: 'linear-gradient(to right, transparent, #c9a22740, transparent)' }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
        />

        {/* Progress steps */}
        <div className="w-full flex flex-col gap-3">
          {GENERATION_STEPS.map((step, i) => (
            <motion.div
              key={step}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + i * 0.6, duration: 0.4, ease: 'easeOut' }}
            >
              {/* Pulsing dot */}
              <motion.span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: '#c9a227' }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{
                  delay: 0.7 + i * 0.6,
                  duration: 1.4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <span className="font-mono text-xs tracking-widest text-foreground/70">
                {step}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Scanning line — appears after all steps are visible */}
        <motion.div
          className="relative w-full overflow-hidden"
          style={{ height: 2 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.8, duration: 0.3 }}
        >
          <motion.div
            className="absolute inset-x-0 top-0 h-full"
            style={{
              background:
                'linear-gradient(to right, transparent 0%, #c9a22780 40%, #c9a227 50%, #c9a22780 60%, transparent 100%)',
            }}
            animate={{ x: ['-110%', '110%'] }}
            transition={{ delay: 4.0, duration: 2.2, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>

        {/* Bottom warning */}
        <motion.p
          className="font-mono text-[9px] tracking-widest uppercase text-center"
          style={{ color: 'rgba(255,255,255,0.15)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          DO NOT CLOSE THIS WINDOW
        </motion.p>
      </div>
    </motion.div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function NewGamePage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { playClick, playHover, playCoin } = useAudio();
  const router = useRouter();
  const [starting, setStarting] = useState<Difficulty | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/');
  }, [user, authLoading, router]);

  if (authLoading || !user) return <FullPageSpinner />;

  const handleStart = async (difficulty: Difficulty) => {
    setError(null);
    setStarting(difficulty);
    playClick();
    try {
      const result = await api.startCase(difficulty);
      playCoin();
      await refreshUser();
      router.push(`/game/${result.sessionId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start case.';
      setError(message);
      setStarting(null);
    }
  };

  const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

  return (
    <>
      {/* Cinematic generating overlay */}
      <AnimatePresence>
        {starting !== null && <CaseGeneratingScreen difficulty={starting} />}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div className="max-w-5xl w-full mx-auto px-5 py-10 flex flex-col gap-8">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="space-y-2"
          >
            <p className="font-mono text-muted/50 text-[10px] tracking-[0.45em] uppercase">
              &#8212; New Investigation &#8212;
            </p>
            <h1 className="font-display text-foreground text-4xl sm:text-5xl font-black tracking-tight leading-none">
              Choose Your Case
            </h1>
            <p className="font-serif text-foreground-dim italic text-lg">
              Each mystery is uniquely generated by AI. No two cases are alike.
            </p>
          </motion.div>

          {/* Balance */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 font-mono text-sm"
          >
            <span className="text-muted/60 text-xs tracking-widest">Your balance:</span>
            <CoinDisplay amount={user.coinBalance} />
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-3 bg-danger/8 border border-danger/30 rounded-xl p-4"
              >
                <AlertTriangle size={15} className="text-danger shrink-0 mt-0.5" />
                <p className="text-foreground text-sm font-mono">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Difficulty cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5" style={{ perspective: '1200px' }}>
            {difficulties.map((diff, i) => {
              const info = DIFFICULTY_INFO[diff];
              const cfg = CARD_CONFIG[diff];
              const canAfford = user.coinBalance >= info.coins;
              const isStarting = starting === diff;
              const isDisabled = !!starting || !canAfford;

              return (
                <motion.div
                  key={diff}
                  initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{
                    duration: 0.75,
                    delay: 0.25 + i * 0.1,
                    ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
                  }}
                >
                  <TiltCard disabled={isDisabled}>
                    <div
                      className={[
                        'glass-card rounded-2xl p-6 flex flex-col gap-5 h-full',
                        'border transition-all duration-300 cursor-default',
                        cfg.accentBorder,
                        cfg.accentGlow,
                        !canAfford ? 'opacity-50' : '',
                      ].join(' ')}
                      onMouseEnter={() => !isDisabled && playHover()}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-mono text-muted/50 text-[9px] uppercase tracking-[0.45em] mb-1.5">
                            Difficulty
                          </p>
                          <h2 className={`font-display text-2xl font-black tracking-widest ${cfg.accentText}`}>
                            {info.label.toUpperCase()}
                          </h2>
                        </div>
                        <div className={`rounded-full border px-3 py-1 ${cfg.badge}`}>
                          <CoinDisplay amount={info.coins} size="sm" />
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="flex flex-col gap-1.5 text-xs font-mono text-muted/70">
                        <div className="flex items-center gap-2">
                          <Users size={11} className="opacity-60" />
                          <span>{info.suspects}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={11} className="opacity-60" />
                          <span>{info.time}</span>
                        </div>
                      </div>

                      {/* Description bullets */}
                      <ul className="space-y-2 flex-1">
                        {cfg.lines.map((line, j) => (
                          <li key={j} className="flex items-start gap-2.5 text-sm">
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.bullet} shrink-0 mt-1.5`} />
                            <span className="font-serif text-foreground/65 leading-snug">{line}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Insufficient coins */}
                      {!canAfford && (
                        <p className="text-danger/80 text-xs font-mono">
                          Need {info.coins - user.coinBalance} more coins.
                        </p>
                      )}

                      {/* CTA */}
                      <Button
                        variant={cfg.buttonVariant}
                        size="md"
                        onClick={() => handleStart(diff)}
                        disabled={isDisabled}
                        loading={isStarting}
                        className="w-full"
                      >
                        {isStarting ? 'Opening File...' : 'Begin Investigation'}
                      </Button>
                    </div>
                  </TiltCard>
                </motion.div>
              );
            })}
          </div>

          {/* Back */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center pt-2"
          >
            <motion.button
              whileHover={{ x: -3 }}
              transition={{ type: 'spring', stiffness: 400 }}
              onClick={() => { playClick(); router.push('/dashboard'); }}
              onMouseEnter={() => playHover()}
              className="text-muted/50 hover:text-foreground font-mono text-xs transition-colors tracking-[0.35em] uppercase"
            >
              &#8592; Return to Headquarters
            </motion.button>
          </motion.div>
        </div>
      </div>
    </>
  );
}
