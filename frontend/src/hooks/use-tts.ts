'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  speak as ttsSpeak,
  stop as ttsStop,
  isSpeaking,
  ttsSupported,
  speakSequence,
  type TTSOptions,
} from '@/lib/tts';

/**
 * React hook wrapping the TTS engine.
 *
 * Usage:
 *   const { speaking, speak, stop, toggle, supported } = useTTS();
 */
export function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const [currentText, setCurrentText] = useState<string | null>(null);
  const activeRef = useRef(false); // track whether this hook instance is speaking

  // Poll speaking state (speechSynthesis doesn't expose reactive events)
  useEffect(() => {
    if (!ttsSupported()) return;
    const id = setInterval(() => {
      const s = isSpeaking();
      setSpeaking(s);
      if (!s && activeRef.current) {
        activeRef.current = false;
        setCurrentText(null);
      }
    }, 120);
    return () => clearInterval(id);
  }, []);

  const speak = useCallback(
    async (text: string, options?: TTSOptions): Promise<void> => {
      if (!ttsSupported()) return;
      activeRef.current = true;
      setSpeaking(true);
      setCurrentText(text);
      try {
        await ttsSpeak(text, options);
      } finally {
        activeRef.current = false;
        setSpeaking(false);
        setCurrentText(null);
      }
    },
    [],
  );

  /**
   * Speak an ordered sequence of text chunks.
   * Calls onChunkDone(index) after each chunk finishes — useful for page-advance.
   */
  const speakChunks = useCallback(
    async (
      chunks: string[],
      options?: TTSOptions,
      onChunkDone?: (index: number) => void,
    ): Promise<void> => {
      if (!ttsSupported()) return;
      activeRef.current = true;
      setSpeaking(true);
      try {
        await speakSequence(chunks, options ?? {}, (i) => {
          setCurrentText(chunks[i + 1] ?? null);
          onChunkDone?.(i);
        });
      } finally {
        activeRef.current = false;
        setSpeaking(false);
        setCurrentText(null);
      }
    },
    [],
  );

  const stop = useCallback(() => {
    ttsStop();
    activeRef.current = false;
    setSpeaking(false);
    setCurrentText(null);
  }, []);

  /** Toggle: if currently speaking the same text, stop; otherwise speak it. */
  const toggle = useCallback(
    (text: string, options?: TTSOptions): void => {
      if (speaking && currentText === text) {
        stop();
      } else {
        speak(text, options);
      }
    },
    [speaking, currentText, speak, stop],
  );

  return {
    supported: ttsSupported(),
    speaking,
    currentText,
    speak,
    speakChunks,
    stop,
    toggle,
  };
}
