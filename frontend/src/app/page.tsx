'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { api, getToken } from '@/lib/api';
import { LoginButton } from '@/components/auth/login-button';
import { FullPageSpinner } from '@/components/ui/spinner';

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

// ── Text scramble effect ──────────────────────────────────────────────────────
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890@#$%&';

function ScrambleText({ text, className }: { text: string; className?: string }) {
  const [display, setDisplay] = useState(text);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scramble = () => {
    let iterations = 0;
    clearInterval(intervalRef.current!);
    intervalRef.current = setInterval(() => {
      setDisplay(
        text
          .split('')
          .map((char, idx) => {
            if (char === ' ') return ' ';
            if (idx < iterations) return text[idx];
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join(''),
      );
      if (iterations >= text.length) {
        clearInterval(intervalRef.current!);
        setDisplay(text);
      }
      iterations += 0.5;
    }, 30);
  };

  useEffect(() => () => clearInterval(intervalRef.current!), []);

  return (
    <span className={className} onMouseEnter={scramble}>
      {display}
    </span>
  );
}

// ── Floating evidence marker ──────────────────────────────────────────────────
function EvidenceMarker({
  number,
  x,
  y,
  delay = 0,
  label,
}: {
  number: number;
  x: string;
  y: string;
  delay?: number;
  label?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, rotate: -15 }}
      animate={{
        opacity: [0, 0.7, 0.5, 0.7],
        scale: [0, 1.1, 0.95, 1],
        rotate: [-15, 5, -3, 2],
        y: [0, -6, 0, -4, 0],
      }}
      transition={{
        duration: 1.2,
        delay,
        ease: EASE,
        y: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: delay + 1.2 },
        opacity: { duration: 1.2, delay },
        rotate: { duration: 1.2, delay },
        scale: { duration: 1.2, delay },
      }}
      className="absolute pointer-events-none"
      style={{ left: x, top: y }}
      aria-hidden="true"
    >
      <div className="relative">
        <div
          className="w-8 h-8 rounded border-2 border-accent bg-accent/15 flex items-center justify-center"
          style={{ boxShadow: '0 0 12px rgba(201,162,39,0.25)' }}
        >
          <span className="font-mono text-accent font-black text-xs">{number}</span>
        </div>
        {label && (
          <div className="absolute left-9 top-0 bg-surface border border-border rounded px-2 py-0.5 whitespace-nowrap">
            <span className="font-mono text-[9px] text-muted/70 tracking-wide">{label}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Typewriter line ───────────────────────────────────────────────────────────
function TypewriterLine({
  text,
  delay = 0,
  className = '',
}: {
  text: string;
  delay?: number;
  className?: string;
}) {
  const [shown, setShown] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay * 1000);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const iv = setInterval(() => {
      setShown(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(iv);
    }, 35);
    return () => clearInterval(iv);
  }, [started, text]);

  return (
    <span className={className}>
      {shown}
      {started && shown.length < text.length && <span className="animate-pulse">_</span>}
    </span>
  );
}

// ── Stat counter ──────────────────────────────────────────────────────────────
function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="font-mono text-accent font-black text-lg tracking-tight">{value}</p>
      <p className="font-mono text-muted/50 text-[9px] tracking-[0.35em] uppercase">{label}</p>
    </div>
  );
}

// ── Feature card ──────────────────────────────────────────────────────────────
function FeatureCard({
  label,
  description,
  delay,
}: {
  label: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.65, delay, ease: EASE }}
      className="glass-card flex-1 rounded-xl p-4 border border-border/50 flex flex-col gap-2"
    >
      <p className="font-mono text-accent/80 text-[10px] tracking-[0.35em] uppercase leading-snug">{label}</p>
      <p className="font-serif text-foreground/55 text-xs italic leading-relaxed">{description}</p>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [_phase, setPhase] = useState(0);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const titleX = useTransform(mouseX, [-300, 300], [-8, 8]);
  const titleY = useTransform(mouseY, [-300, 300], [-4, 4]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setChecking(false);
      return;
    }
    api
      .getMe()
      .then(() => router.replace('/dashboard'))
      .catch(() => setChecking(false));
  }, [router]);

  useEffect(() => {
    if (!checking) {
      const t = setTimeout(() => setPhase(1), 300);
      return () => clearTimeout(t);
    }
  }, [checking]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  if (checking) return <FullPageSpinner />;

  return (
    <>
      {/* ── Marquee keyframe injection ── */}
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track {
          animation: marquee 28s linear infinite;
          white-space: nowrap;
        }
      `}</style>

      <div
        className="flex-1 relative flex flex-col items-center justify-center overflow-y-auto min-h-0"
        onMouseMove={handleMouseMove}
      >
        {/* Top gold accent line */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-px pointer-events-none"
          style={{
            background: 'linear-gradient(to right, transparent, rgba(201,162,39,0.4), transparent)',
            zIndex: 2,
          }}
          aria-hidden="true"
        />

        {/* Vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 35%, rgba(4,4,6,0.65) 100%)',
            zIndex: 2,
          }}
          aria-hidden="true"
        />

        {/* Bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
          style={{ background: 'linear-gradient(to top, #060608, transparent)', zIndex: 2 }}
          aria-hidden="true"
        />

        {/* Crime-scene tape diagonal band */}
        <div
          className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
          style={{
            background:
              'repeating-linear-gradient(45deg, #f0c000 0, #f0c000 12px, #060608 12px, #060608 28px)',
            opacity: 0.065,
            zIndex: 1,
          }}
          aria-hidden="true"
        />

        {/* Dossier number — top left */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 1, delay: 1.0 }}
          className="absolute top-8 left-6 pointer-events-none hidden sm:block"
          style={{ zIndex: 3 }}
          aria-hidden="true"
        >
          <p className="font-mono text-[9px] text-muted/60 tracking-[0.45em] uppercase">
            CASE FILE #MMD-2026
          </p>
        </motion.div>

        {/* Floating evidence markers */}
        <EvidenceMarker number={1} x="7%" y="22%" delay={2.0} label="Point of entry" />
        <EvidenceMarker number={2} x="82%" y="15%" delay={2.3} label="Last known" />
        <EvidenceMarker number={3} x="88%" y="72%" delay={2.6} />
        <EvidenceMarker number={4} x="5%" y="68%" delay={2.9} />

        {/* "CASE UNSOLVED" stamp */}
        <motion.div
          initial={{ opacity: 0, scale: 1.4, rotate: -12 }}
          animate={{ opacity: 0.12, scale: 1, rotate: -8 }}
          transition={{ duration: 0.9, delay: 2.5, ease: EASE }}
          className="absolute top-[18%] right-[8%] pointer-events-none hidden xl:block"
          style={{ zIndex: 2 }}
          aria-hidden="true"
        >
          <div className="border-4 border-danger rounded px-4 py-2 font-mono text-danger text-sm font-black tracking-[0.3em] uppercase">
            Case Unsolved
          </div>
        </motion.div>

        {/* Report header — typewriter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="absolute top-8 left-1/2 -translate-x-1/2 pointer-events-none hidden sm:block"
          style={{ zIndex: 3 }}
          aria-hidden="true"
        >
          <p className="font-mono text-[9px] text-muted/30 tracking-[0.5em] uppercase">
            <TypewriterLine
              text="[ CLASSIFIED DOSSIER — METROPOLITAN DETECTIVE AGENCY ]"
              delay={1.8}
            />
          </p>
        </motion.div>

        {/* Main content */}
        <motion.div
          className="relative flex flex-col items-center text-center px-6 max-w-2xl mx-auto"
          style={{ x: titleX, y: titleY, zIndex: 10 }}
        >
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="flex items-center gap-3 mb-10"
          >
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-accent/50" />
            <span className="font-mono text-accent/70 text-[10px] tracking-[0.45em] uppercase">
              A Detective Experience
            </span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-accent/50" />
          </motion.div>

          {/* Main title — staggered blur-in from alternating sides */}
          <div className="mb-8 space-y-1">
            {(['MURDER', 'MYSTERY', 'DETECTIVE'] as const).map((word, i) => (
              <motion.div
                key={word}
                initial={{
                  opacity: 0,
                  x: i % 2 === 0 ? -80 : 80,
                  filter: 'blur(18px)',
                  scale: 0.94,
                }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)', scale: 1 }}
                transition={{
                  duration: 1.05,
                  delay: 0.15 + i * 0.2,
                  ease: EASE,
                }}
              >
                <h1
                  className={[
                    'font-display font-black leading-none tracking-[0.12em] select-none cursor-default',
                    i === 0 ? 'text-5xl sm:text-7xl md:text-8xl text-foreground' : '',
                    i === 1
                      ? 'text-5xl sm:text-7xl md:text-8xl text-accent animate-flicker'
                      : '',
                    i === 2
                      ? 'text-3xl sm:text-4xl md:text-5xl text-foreground/55 tracking-[0.35em]'
                      : '',
                  ].join(' ')}
                  style={i === 1 ? { textShadow: '0 0 40px rgba(201,162,39,0.45)' } : undefined}
                >
                  <ScrambleText text={word} />
                </h1>
              </motion.div>
            ))}
          </div>

          {/* Gold divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.8, ease: EASE }}
            className="w-32 h-px my-8"
            style={{
              background:
                'linear-gradient(to right, transparent, rgba(201,162,39,0.6), transparent)',
            }}
          />

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.0, ease: EASE }}
            className="font-serif text-foreground/80 text-xl italic mb-4 leading-relaxed"
          >
            &ldquo;Every case is unique. Every suspect has a story.&rdquo;
          </motion.p>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.15, ease: EASE }}
            className="font-mono text-muted/70 text-sm leading-loose mb-10 max-w-lg tracking-wide"
          >
            The city never sleeps, and neither do its secrets. Step into a world of shadows and
            half-truths where each interrogation brings you closer — or further — from the truth.
            The clock is ticking, Detective.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 1.3, ease: EASE }}
          >
            <LoginButton />
          </motion.div>

          {/* Feature cards */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 1.55 }}
            className="w-full mt-10 flex flex-col sm:flex-row gap-3"
          >
            <FeatureCard
              label="◆ AI Suspects"
              description="Every character is uniquely generated and fully interrogatable"
              delay={1.6}
            />
            <FeatureCard
              label="◆ Voice Narration"
              description="Full voice for case files and character responses"
              delay={1.7}
            />
            <FeatureCard
              label="◆ 3 Difficulties"
              description="From obvious murders to layered conspiracies"
              delay={1.8}
            />
          </motion.div>

          {/* Stat strip */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.9, ease: EASE }}
            className="mt-10 flex items-center gap-6 sm:gap-10"
          >
            <div className="h-8 w-px bg-border/50" />
            <StatItem value="∞" label="Unique Cases" />
            <div className="h-8 w-px bg-border/50" />
            <StatItem value="AI" label="Powered" />
            <div className="h-8 w-px bg-border/50" />
            <StatItem value="3" label="Difficulties" />
            <div className="h-8 w-px bg-border/50" />
          </motion.div>

          {/* Footer tag */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 2.1 }}
            className="mt-8 flex items-center gap-4"
          >
            <div className="h-px w-12 bg-border" />
            <span className="font-mono text-muted/40 text-[10px] tracking-[0.4em] uppercase">
              Est. 2026 &bull; Every Mystery Unique
            </span>
            <div className="h-px w-12 bg-border" />
          </motion.div>
        </motion.div>

        {/* Decorative side text */}
        {(['left', 'right'] as const).map((side) => (
          <motion.div
            key={side}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2, duration: 1 }}
            className={`absolute ${side}-6 top-1/2 -translate-y-1/2 hidden xl:flex flex-col items-center gap-3`}
            style={{ zIndex: 10 }}
            aria-hidden="true"
          >
            <div className="h-24 w-px bg-gradient-to-b from-transparent to-border" />
            <span
              className="font-mono text-muted/30 text-[9px] tracking-[0.4em] uppercase"
              style={{ writingMode: 'vertical-rl' }}
            >
              {side === 'left' ? 'Est. 2026' : 'Case Files'}
            </span>
            <div className="h-24 w-px bg-gradient-to-t from-transparent to-border" />
          </motion.div>
        ))}

        {/* Scan line — horizontal moving light effect */}
        <motion.div
          initial={{ top: '-5%' }}
          animate={{ top: ['0%', '105%'] }}
          transition={{
            duration: 8,
            delay: 1.5,
            repeat: Infinity,
            repeatDelay: 12,
            ease: 'linear',
          }}
          className="absolute left-0 right-0 pointer-events-none"
          style={{
            height: '1px',
            background:
              'linear-gradient(to right, transparent, rgba(201,162,39,0.08), rgba(201,162,39,0.15), rgba(201,162,39,0.08), transparent)',
            zIndex: 3,
          }}
          aria-hidden="true"
        />

        {/* Bottom scrolling marquee */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2.4 }}
          className="absolute bottom-0 left-0 right-0 overflow-hidden pointer-events-none"
          style={{ zIndex: 4, opacity: 0.15 }}
          aria-hidden="true"
        >
          <div className="marquee-track inline-flex">
            {/* Duplicate for seamless loop */}
            {[0, 1].map((n) => (
              <span key={n} className="font-mono text-[9px] tracking-[0.4em] uppercase text-muted/80 px-8 py-2">
                METROPOLITAN DETECTIVE AGENCY &mdash; CASE FILES CLASSIFIED &mdash; AI GENERATED MYSTERIES &mdash; FULLY VOICED &mdash;&nbsp;
                METROPOLITAN DETECTIVE AGENCY &mdash; CASE FILES CLASSIFIED &mdash; AI GENERATED MYSTERIES &mdash; FULLY VOICED &mdash;&nbsp;
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* AnimatePresence kept for downstream transitions */}
      <AnimatePresence />
    </>
  );
}
