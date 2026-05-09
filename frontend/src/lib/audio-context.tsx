'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  startAmbient,
  stopAmbient,
  setMuted,
  isMuted,
  playClick,
  playHover,
  playSend,
  playReceive,
  playCoin,
  playWin,
  playLose,
  playTimerWarning,
} from './audio';

const MUSIC_SRC = '/music/mystery-thriller.mp3';
const MUSIC_VOLUME = 0.32; // gentle background — never overpowers TTS

interface AudioContextValue {
  muted: boolean;
  toggleMute: () => void;
  stopAmbient: () => void;
  startAmbient: () => void;
  startMusic: () => void;
  stopMusic: () => void;
  playClick: () => void;
  playHover: () => void;
  playSend: () => void;
  playReceive: () => void;
  playCoin: () => void;
  playWin: () => void;
  playLose: () => void;
  playTimerWarning: () => void;
}

const AudioCtx = createContext<AudioContextValue>({
  muted: false,
  toggleMute: () => {},
  stopAmbient: () => {},
  startAmbient: () => {},
  startMusic: () => {},
  stopMusic: () => {},
  playClick: () => {},
  playHover: () => {},
  playSend: () => {},
  playReceive: () => {},
  playCoin: () => {},
  playWin: () => {},
  playLose: () => {},
  playTimerWarning: () => {},
});

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [muted, setMutedState] = useState(false);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const musicWantedRef = useRef<boolean>(true); // true = pages outside the game session want music
  const interactedRef = useRef<boolean>(false);

  // Lazy-create the <audio> element (browser allows it; playback still gated on user interaction)
  const ensureMusic = useCallback((): HTMLAudioElement | null => {
    if (typeof window === 'undefined') return null;
    if (musicRef.current) return musicRef.current;
    const a = new Audio(MUSIC_SRC);
    a.loop = true;
    a.volume = MUSIC_VOLUME;
    a.preload = 'auto';
    musicRef.current = a;
    return a;
  }, []);

  const startMusic = useCallback(() => {
    musicWantedRef.current = true;
    if (isMuted()) return;
    const a = ensureMusic();
    if (!a) return;
    // play() returns a Promise; some browsers reject if no user interaction yet — silently ignore
    a.play().catch(() => {});
  }, [ensureMusic]);

  const stopMusic = useCallback(() => {
    musicWantedRef.current = false;
    const a = musicRef.current;
    if (!a) return;
    a.pause();
  }, []);

  // Start ambient + music after first user interaction (browser autoplay policy)
  useEffect(() => {
    const handleInteraction = () => {
      interactedRef.current = true;
      if (!isMuted()) {
        startAmbient();
        if (musicWantedRef.current) {
          const a = ensureMusic();
          a?.play().catch(() => {});
        }
      }
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);
    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
      stopAmbient();
      try { musicRef.current?.pause(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMute = useCallback(() => {
    setMutedState((prev) => {
      const next = !prev;
      setMuted(next);
      // Sync music with mute state
      const a = musicRef.current;
      if (a) {
        if (next) a.pause();
        else if (musicWantedRef.current && interactedRef.current) a.play().catch(() => {});
      }
      return next;
    });
  }, []);

  const value: AudioContextValue = {
    muted,
    toggleMute,
    stopAmbient,
    startAmbient,
    startMusic,
    stopMusic,
    playClick,
    playHover,
    playSend,
    playReceive,
    playCoin,
    playWin,
    playLose,
    playTimerWarning,
  };

  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>;
}

export function useAudio() {
  return useContext(AudioCtx);
}
