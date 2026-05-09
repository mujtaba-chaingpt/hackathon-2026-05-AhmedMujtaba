'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LogOut, Volume2, VolumeX, Fingerprint } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useAudio } from '@/lib/audio-context';
import { CoinDisplay } from './coin-display';

export function Header() {
  const { user, logout } = useAuth();
  const { muted, toggleMute, playClick, playHover } = useAudio();

  if (!user) return null;

  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="shrink-0 sticky top-0 z-40"
    >
      {/* Pill container */}
      <div className="max-w-6xl mx-auto px-4 pt-3 pb-0">
        <div
          className="rounded-2xl px-5 py-2.5 flex items-center justify-between border"
          style={{
            background:
              'linear-gradient(180deg, rgba(18,15,9,0.95) 0%, rgba(10,9,6,0.95) 100%)',
            borderColor: 'rgba(201,162,39,0.22)',
            boxShadow:
              '0 8px 32px rgba(0,0,0,0.7), inset 0 1px 0 rgba(201,162,39,0.10)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
          }}
        >
          {/* Logo */}
          <Link
            href="/dashboard"
            onClick={() => playClick()}
            onMouseEnter={() => playHover()}
            className="font-display font-bold text-base tracking-[0.18em] uppercase flex items-center gap-3 group"
          >
            <motion.span
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="relative w-9 h-9 rounded-md flex items-center justify-center border transition-colors"
              style={{
                background:
                  'radial-gradient(circle at 30% 30%, rgba(201,162,39,0.18), rgba(155,34,38,0.05))',
                borderColor: 'rgba(201,162,39,0.45)',
                boxShadow:
                  'inset 0 0 14px rgba(201,162,39,0.18), 0 0 18px rgba(201,162,39,0.10)',
              }}
              aria-hidden="true"
            >
              <Fingerprint size={17} className="text-accent" strokeWidth={1.6} />
              {/* Pulse ring */}
              <motion.span
                className="absolute inset-0 rounded-md"
                style={{ border: '1px solid rgba(201,162,39,0.4)' }}
                animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.3, 1] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeOut' }}
              />
            </motion.span>
            <span className="hidden sm:flex flex-col leading-none">
              <span
                className="text-[8px] tracking-[0.55em] mb-0.5"
                style={{ color: 'rgba(255,243,210,0.4)' }}
              >
                EST. 1947
              </span>
              <span
                className="text-[14px] tracking-[0.18em] group-hover:text-accent-hover transition-colors"
                style={{ color: '#e8c84a', textShadow: '0 0 14px rgba(201,162,39,0.25)' }}
              >
                Murder Mystery
              </span>
            </span>
          </Link>

          {/* Right side controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Coin balance */}
            <CoinDisplay amount={user.coinBalance} />

            {/* Sound toggle */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => { playClick(); toggleMute(); }}
              title={muted ? 'Unmute sounds' : 'Mute sounds'}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
              style={{
                background: 'rgba(20,18,12,0.95)',
                border: '1px solid rgba(201,162,39,0.20)',
                color: muted ? 'rgba(155,34,38,0.85)' : 'rgba(232,200,74,0.85)',
              }}
            >
              {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </motion.button>

            {/* Avatar */}
            {user.picture ? (
              <motion.div whileHover={{ scale: 1.05 }} className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-9 h-9 rounded-full object-cover"
                  style={{
                    border: '1px solid rgba(201,162,39,0.45)',
                    boxShadow: '0 0 12px rgba(201,162,39,0.20), inset 0 0 0 2px rgba(0,0,0,0.6)',
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold font-mono"
                style={{
                  background: 'rgba(201,162,39,0.10)',
                  border: '1px solid rgba(201,162,39,0.45)',
                  color: '#e8c84a',
                }}
              >
                {initials}
              </motion.div>
            )}

            {/* Logout */}
            <motion.button
              whileHover={{ scale: 1.02, x: 2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => { playClick(); logout(); }}
              onMouseEnter={() => playHover()}
              title="Sign out"
              className="flex items-center gap-1.5 transition-all duration-200 text-sm font-mono tracking-widest uppercase group"
              style={{ color: 'rgba(255,243,210,0.55)' }}
            >
              <LogOut size={14} className="group-hover:translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline text-[11px]">Exit</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
