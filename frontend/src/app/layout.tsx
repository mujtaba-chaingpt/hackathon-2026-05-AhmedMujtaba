import React from 'react';
import type { Metadata } from 'next';
import { Playfair_Display, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { AudioProvider } from '@/lib/audio-context';
import { Header } from '@/components/layout/header';
import NoirBackground from '@/components/ui/noir-background';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

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
    <html lang="en" className={`${playfair.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-background text-foreground font-serif h-[100dvh] flex flex-col overflow-hidden">
        {/* ── Animated canvas background ── */}
        <NoirBackground />

        {/* ── Film grain overlay (fixed, pointer-events-none) ── */}
        <div className="grain-overlay" aria-hidden="true" />

        {/* ── Content sits above canvas (z-index via relative/z-10) ── */}
        <div className="relative z-10 flex flex-col flex-1 min-h-0">
          <AuthProvider>
            <AudioProvider>
              <Header />
              {/* Each page decides its own scroll behavior:
                  - Game session uses overflow-hidden internally (chat scrolls only)
                  - Dashboard/landing/result use overflow-y-auto on their root */}
              <main className="flex-1 flex flex-col min-h-0">{children}</main>
            </AudioProvider>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
