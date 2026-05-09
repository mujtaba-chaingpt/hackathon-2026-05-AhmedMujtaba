'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  default: [
    'bg-accent text-background font-bold tracking-widest uppercase',
    'border border-accent/80',
    'hover:bg-accent-hover hover:border-accent-hover',
    'hover:shadow-gold-sm',
  ].join(' '),
  destructive: [
    'bg-danger text-foreground font-bold tracking-widest uppercase',
    'border border-danger/80',
    'hover:bg-danger-bright hover:border-danger-bright',
    'hover:shadow-crimson-sm',
  ].join(' '),
  outline: [
    'bg-transparent text-foreground font-bold tracking-widest uppercase',
    'border border-border-bright',
    'hover:border-accent hover:text-accent',
  ].join(' '),
  ghost: [
    'bg-transparent text-muted font-semibold tracking-widest uppercase',
    'border border-transparent',
    'hover:text-foreground hover:bg-surface-2',
  ].join(' '),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-1.5 text-xs rounded-md gap-1.5',
  md: 'px-6 py-2.5 text-sm rounded-lg gap-2',
  lg: 'px-8 py-4 text-base rounded-xl gap-2.5',
};

export function Button({
  variant = 'default',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  onClick,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      {...(props as any)}
      disabled={disabled || loading}
      onClick={onClick}
      whileHover={!(disabled || loading) ? { scale: 1.02 } : {}}
      whileTap={!(disabled || loading) ? { scale: 0.97, y: 1 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={twMerge(
        clsx(
          'inline-flex items-center justify-center transition-all duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
          'relative overflow-hidden',
          variantClasses[variant],
          sizeClasses[size],
          className,
        ),
      )}
    >
      {/* Shimmer on hover */}
      {variant === 'default' && (
        <span
          className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background:
              'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)',
          }}
        />
      )}

      {loading && (
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full shrink-0"
        />
      )}
      {children}
    </motion.button>
  );
}
