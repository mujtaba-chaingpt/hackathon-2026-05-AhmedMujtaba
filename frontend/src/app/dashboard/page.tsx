'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Folder, Check, X as XIcon, TrendingUp, ArrowRight, Coins,
  ShieldAlert, Award, Users, Clock, FileSearch, Skull,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useAudio } from '@/lib/audio-context';
import { FullPageSpinner } from '@/components/ui/spinner';
import { OnboardingTour } from '@/components/onboarding/onboarding-tour';
import { DIFFICULTY_INFO } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DifficultyStats { t: number; w: number; }
interface DetectiveStats {
  total?: number; wins?: number;
  easy?: DifficultyStats; medium?: DifficultyStats; hard?: DifficultyStats;
}

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 0.55, delay, ease: EASE },
});

const STEPS = [
  { n: '01', title: 'Open the file', text: 'Choose a difficulty. Coins are wired up-front.' },
  { n: '02', title: 'Read the dossier', text: 'Victim, scene, suspects — every detail is a thread.' },
  { n: '03', title: 'Interrogate', text: 'Press for contradictions. Watch the alibis bleed.' },
  { n: '04', title: 'Name the killer', text: 'Solve and double your purse. Fail and the badge dims.' },
];

// ─── Animated counter ────────────────────────────────────────────────────────
function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const start = performance.now();
    const duration = 1100;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * value));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, [value]);
  return <>{display}{suffix}</>;
}

// ─── Stat tile ───────────────────────────────────────────────────────────────
function StatTile({
  label, value, suffix, icon, delay, tone = 'neutral',
}: {
  label: string; value: number; suffix?: string;
  icon: React.ReactNode; delay: number;
  tone?: 'neutral' | 'success' | 'danger' | 'gold';
}) {
  const palette = {
    neutral: { color: '#f5e6c8', bar: 'rgba(255,243,210,0.35)', glow: 'rgba(255,243,210,0.06)' },
    success: { color: '#5fcf94', bar: 'rgba(95,207,148,0.55)',  glow: 'rgba(39,174,96,0.10)' },
    danger:  { color: '#e07f82', bar: 'rgba(224,127,130,0.55)', glow: 'rgba(155,34,38,0.10)'  },
    gold:    { color: '#e8c84a', bar: 'rgba(232,200,74,0.55)',  glow: 'rgba(201,162,39,0.10)' },
  }[tone];

  return (
    <motion.div
      {...fadeUp(delay)}
      className="relative rounded-xl p-3 overflow-hidden group"
      style={{
        background:
          'linear-gradient(160deg, rgba(22,18,12,0.95) 0%, rgba(12,10,8,0.95) 100%)',
        border: '1px solid rgba(201,162,39,0.18)',
        boxShadow: `0 6px 18px rgba(0,0,0,0.5), inset 0 1px 0 rgba(201,162,39,0.08), inset 0 0 30px ${palette.glow}`,
      }}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
    >
      <div
        className="absolute top-0 left-4 right-4 h-px"
        style={{ background: `linear-gradient(to right, transparent, ${palette.bar}, transparent)` }}
      />
      <div className="flex items-start justify-between mb-1">
        <span className="font-mono text-[9px] tracking-[0.4em] uppercase" style={{ color: 'rgba(255,243,210,0.5)' }}>
          {label}
        </span>
        <span style={{ color: palette.color, opacity: 0.85 }}>{icon}</span>
      </div>
      <div
        className="font-display font-black text-[26px] leading-none tracking-tight tabular-nums"
        style={{ color: palette.color, textShadow: `0 0 24px ${palette.glow}` }}
      >
        <AnimatedNumber value={value} suffix={suffix} />
      </div>
    </motion.div>
  );
}

// ─── Performance bar ─────────────────────────────────────────────────────────
function PerfBar({
  label, wins, total, color, delay,
}: { label: string; wins: number; total: number; color: string; delay: number }) {
  const pct = total > 0 ? Math.round((wins / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[0.4em] uppercase text-[#f5e6c8]/70">
          {label}
        </span>
        <span className="font-mono text-[10px] text-[#f5e6c8]/60 tabular-nums">
          {wins}/{total} &middot; <span style={{ color }}>{pct}%</span>
        </span>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden relative"
        style={{
          background: 'rgba(255,243,210,0.06)',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.6)',
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.1, delay, ease: EASE }}
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${color} 0%, ${color}90 100%)`,
            boxShadow: `0 0 10px ${color}66`,
          }}
        />
      </div>
    </div>
  );
}

// ─── Difficulty card ─────────────────────────────────────────────────────────
function DifficultyCard({
  k, info, i,
}: {
  k: 'easy' | 'medium' | 'hard';
  info: typeof DIFFICULTY_INFO[keyof typeof DIFFICULTY_INFO];
  i: number;
}) {
  const palette = {
    easy:   { name: '#5fcf94', dim: 'rgba(95,207,148,0.20)', bg: 'rgba(39,174,96,0.06)',  ring: 'rgba(39,174,96,0.30)'  },
    medium: { name: '#e8c84a', dim: 'rgba(232,200,74,0.20)',  bg: 'rgba(201,162,39,0.06)', ring: 'rgba(201,162,39,0.30)' },
    hard:   { name: '#e07f82', dim: 'rgba(224,127,130,0.20)', bg: 'rgba(155,34,38,0.06)',  ring: 'rgba(155,34,38,0.30)'  },
  }[k];

  return (
    <motion.div
      {...fadeUp(0.16 + i * 0.05)}
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 280, damping: 20 }}
      className="relative rounded-xl p-3 overflow-hidden flex flex-col gap-2"
      style={{
        background: `linear-gradient(160deg, rgba(22,18,12,0.95) 0%, rgba(12,10,8,0.95) 100%), ${palette.bg}`,
        border: `1px solid ${palette.ring}`,
        boxShadow: `0 6px 18px rgba(0,0,0,0.5), inset 0 1px 0 ${palette.dim}`,
      }}
    >
      <div
        className="absolute -top-3 -right-3 w-14 h-14 rounded-full opacity-[0.06] pointer-events-none"
        style={{ background: palette.name }}
      />

      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-[8px] tracking-[0.45em] uppercase mb-0.5" style={{ color: 'rgba(255,243,210,0.5)' }}>
            {info.label}
          </p>
          <p className="font-display font-black text-[20px] leading-none" style={{ color: palette.name, textShadow: `0 0 16px ${palette.dim}` }}>
            {info.coins}
            <span className="text-[#f5e6c8]/40 text-[9px] font-mono font-normal ml-1">cost</span>
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[8px] tracking-[0.4em] uppercase mb-0.5" style={{ color: 'rgba(255,243,210,0.4)' }}>
            Reward
          </p>
          <p className="font-display font-black text-[20px] leading-none" style={{ color: palette.name, textShadow: `0 0 16px ${palette.dim}` }}>
            {info.reward}
          </p>
        </div>
      </div>

      <div className="h-px" style={{ background: `linear-gradient(to right, ${palette.dim}, transparent)` }} />

      <p className="font-serif text-[#f5e6c8]/75 text-[11px] italic leading-snug flex-1 line-clamp-2">
        {info.description}
      </p>

      <div className="flex items-center justify-between font-mono text-[9px]" style={{ color: 'rgba(255,243,210,0.55)' }}>
        <span className="flex items-center gap-1">
          <Users size={9} style={{ color: palette.name, opacity: 0.7 }} />
          {info.suspects}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={9} style={{ color: palette.name, opacity: 0.7 }} />
          {info.time}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Detective Badge card (rank + ID + milestone) ────────────────────────────
const RANK_THRESHOLDS = [
  { name: 'CADET',            min: 0  },
  { name: 'JUNIOR DETECTIVE', min: 1  },
  { name: 'DETECTIVE',        min: 5  },
  { name: 'INSPECTOR',        min: 10 },
  { name: 'CHIEF INSPECTOR',  min: 25 },
];

function DetectiveBadge({
  firstName, rank, wins, total, userId,
}: { firstName: string; rank: string; wins: number; total: number; userId: string }) {
  // Find next rank threshold
  const currentIdx = RANK_THRESHOLDS.findIndex((r) => r.name === rank);
  const nextRank = RANK_THRESHOLDS[currentIdx + 1];
  const progress = nextRank
    ? Math.min(100, Math.round((wins / nextRank.min) * 100))
    : 100;

  return (
    <motion.div
      {...fadeUp(0.22)}
      className="relative rounded-xl px-4 py-3 overflow-hidden flex-1 flex flex-col gap-2.5"
      style={{
        background: 'linear-gradient(160deg, rgba(28,22,14,0.97) 0%, rgba(14,10,8,0.97) 100%)',
        border: '1px solid rgba(201,162,39,0.30)',
        boxShadow: '0 6px 22px rgba(0,0,0,0.6), inset 0 1px 0 rgba(201,162,39,0.18), inset 0 0 80px rgba(155,34,38,0.06)',
      }}
    >
      <div
        className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-[0.08] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #c9a227 0%, transparent 70%)' }}
      />

      {/* Header strip */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] tracking-[0.4em] uppercase" style={{ color: 'rgba(255,243,210,0.7)' }}>
          Detective Profile
        </span>
        <span
          className="font-mono text-[8px] tracking-[0.3em] uppercase rounded px-1.5 py-0.5"
          style={{
            background: 'rgba(155,34,38,0.10)',
            border: '1px solid rgba(224,127,130,0.45)',
            color: '#e07f82',
          }}
        >
          ON FILE
        </span>
      </div>

      {/* Main row: seal + rank info */}
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <motion.div
            className="w-[52px] h-[52px] rounded-full flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle at 30% 30%, rgba(232,200,74,0.20) 0%, rgba(155,34,38,0.06) 100%)',
              border: '2px solid rgba(232,200,74,0.55)',
              boxShadow: 'inset 0 0 14px rgba(232,200,74,0.20), 0 0 18px rgba(232,200,74,0.15)',
            }}
            animate={{ rotate: [0, 1, -1, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Award size={22} style={{ color: '#e8c84a' }} strokeWidth={1.6} />
          </motion.div>
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ border: '1px dashed rgba(232,200,74,0.30)' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="font-display font-black text-[16px] leading-tight tracking-tight truncate"
            style={{ color: '#e8c84a', textShadow: '0 0 16px rgba(232,200,74,0.30)' }}
          >
            {rank}
          </p>
          <p className="font-mono text-[10px] truncate" style={{ color: 'rgba(255,243,210,0.55)' }}>
            Det. {firstName} &middot; #{userId.slice(0, 6).toUpperCase()}
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="font-mono text-[8px] tracking-[0.3em] uppercase" style={{ color: 'rgba(255,243,210,0.45)' }}>
            Status
          </p>
          <p className="font-mono text-[10px] tracking-[0.2em]" style={{ color: '#5fcf94' }}>
            ACTIVE
          </p>
        </div>
      </div>

      {/* Promotion progress (compact) */}
      {nextRank ? (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] tracking-[0.3em] uppercase" style={{ color: 'rgba(255,243,210,0.55)' }}>
              Path to {nextRank.name}
            </span>
            <span className="font-mono text-[9px] tabular-nums" style={{ color: '#e8c84a' }}>
              {wins}/{nextRank.min}
            </span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,243,210,0.06)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.6)' }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.4, delay: 0.4, ease: EASE }}
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #b8860b 0%, #e8c84a 100%)',
                boxShadow: '0 0 10px rgba(232,200,74,0.55)',
              }}
            />
          </div>
        </div>
      ) : (
        <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-center" style={{ color: '#e8c84a' }}>
          &diams; Pinnacle Achieved &diams;
        </p>
      )}
    </motion.div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, loading } = useAuth();
  const { playClick, playHover } = useAudio();
  const router = useRouter();
  const [stats, setStats] = useState<DetectiveStats>({});

  useEffect(() => {
    if (!loading && !user) router.replace('/');
  }, [user, loading, router]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('detective_stats');
      if (raw) setStats(JSON.parse(raw) as DetectiveStats);
    } catch { /* ignore */ }
  }, []);

  if (loading || !user) return <FullPageSpinner />;

  const firstName = user.name.split(' ')[0];
  const total   = stats.total ?? 0;
  const wins    = stats.wins ?? 0;
  const losses  = total - wins;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const easy    = stats.easy   ?? { t: 0, w: 0 };
  const medium  = stats.medium ?? { t: 0, w: 0 };
  const hard    = stats.hard   ?? { t: 0, w: 0 };

  // Detective rank
  const rank = wins >= 25 ? 'CHIEF INSPECTOR'
             : wins >= 10 ? 'INSPECTOR'
             : wins >= 5  ? 'DETECTIVE'
             : wins >= 1  ? 'JUNIOR DETECTIVE'
             : 'CADET';

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
      {/* First-time onboarding tour — shows once per browser, skippable */}
      <OnboardingTour />
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-5 py-3 sm:py-4 flex flex-col gap-3 flex-1 min-h-0">
        <div className="flex flex-col lg:flex-row gap-3 flex-1 min-h-0">

          {/* ── LEFT COLUMN ───────────────────────────────────────── */}
          <div className="flex flex-col gap-3 lg:w-[40%] xl:w-[38%]">

            {/* Hero greeting (compact) */}
            <motion.div {...fadeUp(0.04)}>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-[9px] tracking-[0.3em] uppercase"
                  style={{
                    background: 'rgba(155,34,38,0.10)',
                    border: '1px solid rgba(155,34,38,0.45)',
                    color: '#e07f82',
                  }}
                >
                  <motion.span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: '#e07f82', boxShadow: '0 0 8px rgba(224,127,130,0.9)' }}
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                  />
                  Active Duty
                </span>
                <span className="font-mono text-[9px] tracking-[0.35em] uppercase text-[#f5e6c8]/45">
                  Rank: <span style={{ color: '#e8c84a' }}>{rank}</span>
                </span>
              </div>

              <h1 className="font-display font-black text-[22px] sm:text-[26px] leading-[1.05] tracking-tight">
                <span className="text-[#f5e6c8]">Good evening,</span><br />
                <motion.span
                  className="inline-block"
                  style={{ color: '#e8c84a', textShadow: '0 0 24px rgba(232,200,74,0.40)' }}
                  animate={{ opacity: [1, 0.8, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  Detective {firstName}.
                </motion.span>
              </h1>
            </motion.div>

            {/* Coin balance + CTA — combined hero card (compact) */}
            <motion.div
              {...fadeUp(0.10)}
              className="relative rounded-xl px-4 py-3 overflow-hidden"
              style={{
                background:
                  'linear-gradient(160deg, rgba(22,18,12,0.97) 0%, rgba(14,10,8,0.97) 100%)',
                border: '1px solid rgba(201,162,39,0.30)',
                boxShadow:
                  '0 12px 32px rgba(0,0,0,0.7), inset 0 1px 0 rgba(201,162,39,0.18), inset 0 0 60px rgba(155,34,38,0.04)',
              }}
            >
              <div
                className="absolute top-0 inset-x-0 h-px"
                style={{ background: 'linear-gradient(to right, transparent, rgba(201,162,39,0.6), transparent)' }}
              />

              <div className="flex items-end justify-between mb-2.5">
                <div>
                  <p className="font-mono text-[9px] tracking-[0.4em] uppercase mb-0.5" style={{ color: 'rgba(255,243,210,0.5)' }}>
                    Operating Budget
                  </p>
                  <div className="flex items-baseline gap-2">
                    <Coins size={18} style={{ color: '#e8c84a' }} />
                    <span
                      className="font-display font-black text-[34px] tabular-nums leading-none"
                      style={{ color: '#e8c84a', textShadow: '0 0 28px rgba(232,200,74,0.45)' }}
                    >
                      <AnimatedNumber value={user.coinBalance} />
                    </span>
                    <span className="font-mono text-[9px] tracking-[0.3em] uppercase" style={{ color: 'rgba(255,243,210,0.4)' }}>
                      coins
                    </span>
                  </div>
                </div>
                <span className="font-mono text-[8px] tracking-[0.4em] uppercase" style={{ color: 'rgba(255,243,210,0.35)' }}>
                  Badge #{user.id.slice(0, 6).toUpperCase()}
                </span>
              </div>

              <Link
                href="/game/new"
                className="block w-full"
                onClick={() => playClick()}
                onMouseEnter={() => playHover()}
              >
                <button
                  className="group w-full px-4 py-2.5 rounded-lg font-display font-black text-[12px] tracking-[0.18em] uppercase relative overflow-hidden flex items-center justify-center gap-2.5 transition-transform duration-200 active:scale-[0.985]"
                  style={{
                    background: 'linear-gradient(180deg, #d4af37 0%, #b8860b 100%)',
                    color: '#0a0805',
                    boxShadow:
                      '0 6px 18px rgba(155,34,38,0.30), 0 0 24px rgba(212,175,55,0.28), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -2px 0 rgba(0,0,0,0.2)',
                  }}
                >
                  <Skull size={14} strokeWidth={2.2} />
                  <span>Begin New Investigation</span>
                  <ArrowRight size={13} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </motion.div>

            {/* Performance breakdown (compact) */}
            <motion.div
              {...fadeUp(0.16)}
              className="rounded-xl px-4 py-3"
              style={{
                background: 'linear-gradient(160deg, rgba(22,18,12,0.95) 0%, rgba(12,10,8,0.95) 100%)',
                border: '1px solid rgba(201,162,39,0.18)',
                boxShadow: '0 6px 18px rgba(0,0,0,0.5), inset 0 1px 0 rgba(201,162,39,0.08)',
              }}
            >
              <div className="flex items-center gap-2 mb-2.5">
                <FileSearch size={12} style={{ color: '#e8c84a' }} />
                <span className="font-mono text-[9px] tracking-[0.4em] uppercase" style={{ color: 'rgba(255,243,210,0.7)' }}>
                  Closure Rate by Difficulty
                </span>
              </div>

              <div className="space-y-2.5">
                <PerfBar label="Easy"   wins={easy.w}   total={easy.t}   color="#5fcf94" delay={0.20} />
                <PerfBar label="Medium" wins={medium.w} total={medium.t} color="#e8c84a" delay={0.24} />
                <PerfBar label="Hard"   wins={hard.w}   total={hard.t}   color="#e07f82" delay={0.28} />
              </div>

              {total === 0 && (
                <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-center mt-2.5 pt-2 border-t" style={{ color: 'rgba(255,243,210,0.35)', borderColor: 'rgba(201,162,39,0.15)' }}>
                  No cases on record &middot; open your first file
                </p>
              )}
            </motion.div>

            {/* Detective Badge card — fills remaining left-column space */}
            <DetectiveBadge
              firstName={firstName}
              rank={rank}
              wins={wins}
              total={total}
              userId={user.id}
            />
          </div>

          {/* ── RIGHT COLUMN ──────────────────────────────────────── */}
          <div className="flex flex-col gap-3 flex-1 min-w-0">

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <StatTile label="Total"    value={total}   icon={<Folder size={13} strokeWidth={1.7} />}     delay={0.10} tone="neutral" />
              <StatTile label="Solved"   value={wins}    icon={<Check size={13} strokeWidth={2.2} />}      delay={0.13} tone="success" />
              <StatTile label="Failed"   value={losses}  icon={<XIcon size={13} strokeWidth={2.2} />}      delay={0.16} tone="danger" />
              <StatTile label="Win Rate" value={winRate} suffix="%" icon={<TrendingUp size={13} strokeWidth={2} />} delay={0.19} tone="gold" />
            </div>

            {/* Difficulty bento */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert size={12} style={{ color: '#e8c84a' }} />
                <span className="font-mono text-[9px] tracking-[0.4em] uppercase" style={{ color: 'rgba(255,243,210,0.7)' }}>
                  Case Catalogue
                </span>
                <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, rgba(201,162,39,0.20), transparent)' }} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {(Object.entries(DIFFICULTY_INFO) as [
                  keyof typeof DIFFICULTY_INFO,
                  (typeof DIFFICULTY_INFO)[keyof typeof DIFFICULTY_INFO],
                ][]).map(([k, info], i) => (
                  <DifficultyCard key={k} k={k} info={info} i={i} />
                ))}
              </div>
            </div>

            {/* Investigation Protocol (compact, fills remaining) */}
            <motion.div
              {...fadeUp(0.28)}
              className="rounded-xl px-4 py-3 flex-1 min-h-0"
              style={{
                background: 'linear-gradient(160deg, rgba(22,18,12,0.95) 0%, rgba(12,10,8,0.95) 100%)',
                border: '1px solid rgba(201,162,39,0.18)',
                boxShadow: '0 6px 18px rgba(0,0,0,0.5), inset 0 1px 0 rgba(201,162,39,0.08)',
              }}
            >
              <div className="flex items-center gap-2 mb-2.5">
                <FileSearch size={12} style={{ color: '#e8c84a' }} />
                <span className="font-mono text-[9px] tracking-[0.4em] uppercase" style={{ color: 'rgba(255,243,210,0.7)' }}>
                  Investigation Protocol
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                {STEPS.map((step, i) => (
                  <motion.div
                    key={step.n}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.30 + i * 0.05, ease: EASE }}
                    className="flex items-start gap-2.5 py-1"
                  >
                    <span
                      className="font-display text-[16px] font-black leading-none shrink-0 mt-0.5 tabular-nums"
                      style={{ color: 'rgba(232,200,74,0.5)' }}
                    >
                      {step.n}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[9px] tracking-[0.25em] uppercase mb-0.5" style={{ color: '#e8c84a' }}>
                        {step.title}
                      </p>
                      <p className="font-serif text-[11px] leading-snug" style={{ color: 'rgba(255,243,210,0.65)' }}>
                        {step.text}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
