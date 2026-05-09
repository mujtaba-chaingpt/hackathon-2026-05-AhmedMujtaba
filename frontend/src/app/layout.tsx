import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { Cinzel, Cormorant_Garamond, Outfit, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { AudioProvider } from '@/lib/audio-context';
import { PostHogProvider } from '@/components/providers/posthog-provider';
import { Header } from '@/components/layout/header';
import NoirBackground from '@/components/ui/noir-background';

// ── Typography pairing ──────────────────────────────────────────────────────
// Display: Cinzel — Roman-inscription serif, perfect for noir title cards
const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
});

// Body serif: Cormorant Garamond — elegant editorial body, gorgeous italics
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-serif-body',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
});

// Sans / UI: Outfit — premium modern grotesk for buttons and UI
const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

// Mono: JetBrains Mono — case IDs and technical labels (kept)
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Murder Mystery Detective',
  description:
    'A noir-themed detective game. Interrogate AI suspects, gather clues, and solve the murder before time runs out.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cinzel.variable} ${cormorant.variable} ${outfit.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-background text-foreground font-serif h-[100dvh] flex flex-col overflow-hidden">
        {/* ── Animated canvas background ── */}
        <NoirBackground />

        {/* ── Film grain overlay (fixed, pointer-events-none) ── */}
        <div className="grain-overlay" aria-hidden="true" />

        {/* ── Content sits above canvas (z-index via relative/z-10) ── */}
        <div className="relative z-10 flex flex-col flex-1 min-h-0">
          {/* PostHogProvider uses useSearchParams → must be inside Suspense */}
          <Suspense fallback={null}>
            <PostHogProvider>
              <AuthProvider>
                <AudioProvider>
                  <Header />
                  {/* Each page decides its own scroll behavior:
                      - Game session uses overflow-hidden internally (chat scrolls only)
                      - Dashboard/landing/result use overflow-y-auto on their root */}
                  <main className="flex-1 flex flex-col min-h-0">{children}</main>
                </AudioProvider>
              </AuthProvider>
            </PostHogProvider>
          </Suspense>
        </div>
      </body>
    </html>
  );
}
