'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { useAudio } from '@/lib/audio-context';
import type { VerdictResult } from '@/lib/types';
import { FullPageSpinner } from '@/components/ui/spinner';
import { CoinDisplay } from '@/components/layout/coin-display';
import { Button } from '@/components/ui/button';

function TypewriterReveal({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayed('');
    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayed(text.slice(0, indexRef.current + 1));
        indexRef.current += 1;
      } else {
        clearInterval(interval);
      }
    }, 20);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <p className="font-serif text-foreground/85 leading-loose text-base whitespace-pre-wrap">
      {displayed}
      {displayed.length < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-0.5 h-4 bg-accent ml-0.5 align-middle"
        />
      )}
    </p>
  );
}

// Confetti-like particles on win
function WinParticles() {
  const particles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 1.5,
    duration: 2 + Math.random() * 2,
    color: i % 3 === 0 ? '#c9a227' : i % 3 === 1 ? '#ede6d6' : '#e0b52a',
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{ left: `${p.x}%`, top: '-10px', backgroundColor: p.color }}
          animate={{
            y: ['0vh', '110vh'],
            x: [0, (p.id % 2 === 0 ? 1 : -1) * (20 + Math.random() * 60)],
            rotate: [0, 360 * (p.id % 2 === 0 ? 1 : -1)],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeIn',
          }}
        />
      ))}
    </div>
  );
}

export default function ResultPage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { playWin, playLose } = useAudio();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [result, setResult] = useState<VerdictResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const soundPlayedRef = useRef(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/');
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!sessionId) return;
    const raw = sessionStorage.getItem(`result_${sessionId}`);
    if (!raw) {
      setNotFound(true);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as VerdictResult;
      setResult(parsed);
      refreshUser();

      // Record stats once per session (guard against double-counting on re-render)
      const statsKey = `mm_stats_recorded_${sessionId}`;
      if (!localStorage.getItem(statsKey)) {
        try {
          const difficulty = (localStorage.getItem(`mm_session_${sessionId}`) ?? 'medium') as string;
          const stored = localStorage.getItem('detective_stats');
          const stats = stored ? JSON.parse(stored) : {
            total: 0, wins: 0,
            easy:   { t: 0, w: 0 },
            medium: { t: 0, w: 0 },
            hard:   { t: 0, w: 0 },
          };
          stats.total = (stats.total ?? 0) + 1;
          if (parsed.correct) stats.wins = (stats.wins ?? 0) + 1;
          const diff = stats[difficulty] ?? { t: 0, w: 0 };
          diff.t = (diff.t ?? 0) + 1;
          if (parsed.correct) diff.w = (diff.w ?? 0) + 1;
          stats[difficulty] = diff;
          localStorage.setItem('detective_stats', JSON.stringify(stats));
          localStorage.setItem(statsKey, '1');
        } catch {}
      }
    } catch {
      setNotFound(true);
    }
  }, [sessionId, refreshUser]);

  // Play outcome sound once
  useEffect(() => {
    if (result && !soundPlayedRef.current) {
      soundPlayedRef.current = true;
      setTimeout(() => {
        if (result.correct) playWin();
        else playLose();
      }, 400);
    }
  }, [result, playWin, playLose]);

  useEffect(() => {
    if (notFound) router.replace('/dashboard');
  }, [notFound, router]);

  if (authLoading || !user) return <FullPageSpinner />;
  if (!result) return <FullPageSpinner />;

  const { correct, reveal, coinBalance, coinsEarned } = result;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto relative">
      {/* Win particles */}
      {correct && <WinParticles />}

      {/* Background glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: correct
            ? 'radial-gradient(ellipse at 50% 20%, rgba(30,107,60,0.12) 0%, transparent 60%)'
            : 'radial-gradient(ellipse at 50% 20%, rgba(155,34,38,0.12) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-2xl w-full mx-auto px-5 py-14 flex flex-col gap-8">

        {/* Status banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className={[
            'glass-card rounded-2xl p-8 flex flex-col items-center text-center gap-4',
            'border',
            correct ? 'border-success/35 shadow-[0_0_30px_rgba(30,107,60,0.15)]' : 'border-danger/35 shadow-crimson-sm',
          ].join(' ')}
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.3 }}
            className={[
              'w-20 h-20 rounded-full flex items-center justify-center text-4xl',
              correct ? 'bg-success/10 border border-success/30' : 'bg-danger/10 border border-danger/30',
            ].join(' ')}
          >
            {correct ? '✓' : '✗'}
          </motion.div>

          {/* Verdict text */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="font-mono text-[10px] text-muted/60 uppercase tracking-[0.45em] mb-2">
              Case Verdict
            </p>
            <h1
              className={[
                'font-display text-4xl sm:text-5xl font-black tracking-widest uppercase',
                correct ? 'text-success-bright' : 'text-danger-bright',
              ].join(' ')}
            >
              {correct ? 'Case Solved' : 'Case Unsolved'}
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="font-serif text-foreground-dim italic"
          >
            {correct
              ? 'Your deduction was correct. Justice is served tonight.'
              : 'The truth eluded you. The killer walks free into the darkness.'}
          </motion.p>
        </motion.div>

        {/* Coin delta */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card rounded-2xl p-5 flex items-center justify-between border border-border-bright/25"
        >
          <div>
            <p className="font-mono text-[10px] text-muted/50 uppercase tracking-[0.4em] mb-1.5">
              {coinsEarned >= 0 ? 'Coins Earned' : 'Coins Lost'}
            </p>
            <motion.span
              initial={{ scale: 1.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.9, type: 'spring', stiffness: 300 }}
              className={[
                'font-mono text-3xl font-black',
                coinsEarned >= 0 ? 'text-success-bright' : 'text-danger-bright',
              ].join(' ')}
            >
              {coinsEarned >= 0 ? '+' : ''}{coinsEarned.toLocaleString()} ⊙
            </motion.span>
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] text-muted/50 uppercase tracking-[0.4em] mb-1.5">
              New Balance
            </p>
            <CoinDisplay amount={coinBalance} size="lg" />
          </div>
        </motion.div>

        {/* Reveal narrative */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-5"
        >
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-border-bright/40" />
            <span className="text-muted/50 font-mono text-[10px] tracking-[0.4em] uppercase">
              The Truth
            </span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-border-bright/40" />
          </div>

          <div className="aged-paper rounded-2xl p-6 space-y-3">
            <p className="font-mono text-[10px] text-accent/50 uppercase tracking-[0.4em]">
              — Detective&apos;s Report —
            </p>
            <TypewriterReveal text={reveal} />
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="flex flex-col items-center gap-4"
        >
          <Button
            size="lg"
            onClick={() => router.push('/dashboard')}
            className="w-full sm:w-auto"
          >
            Return to Headquarters
          </Button>
          <motion.button
            whileHover={{ x: 3 }}
            transition={{ type: 'spring', stiffness: 400 }}
            onClick={() => router.push('/game/new')}
            className="font-mono text-xs text-muted/50 hover:text-accent transition-colors tracking-widest uppercase"
          >
            Start Another Investigation &#8594;
          </motion.button>
        </motion.div>

        {/* Footer quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="text-center pb-4"
        >
          <p className="font-serif text-muted/40 italic text-sm">
            {correct
              ? '“The city sleeps a little easier tonight.”'
              : '“In this city, not every case is solved. Not every killer is caught.”'}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
