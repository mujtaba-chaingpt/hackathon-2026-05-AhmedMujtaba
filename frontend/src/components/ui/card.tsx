import React from 'react';
import { twMerge } from 'tailwind-merge';

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className, children }: CardProps) {
  return (
    <div
      className={twMerge(
        'glass-card rounded-xl p-6 border border-border-bright/25',
        className,
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  className?: string;
  children: React.ReactNode;
}

export function CardHeader({ className, children }: CardHeaderProps) {
  return (
    <div className={twMerge('mb-4 pb-4 border-b border-border-bright/20', className)}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  className?: string;
  children: React.ReactNode;
}

export function CardTitle({ className, children }: CardTitleProps) {
  return (
    <h3
      className={twMerge(
        'font-display text-lg font-bold text-accent tracking-widest uppercase',
        className,
      )}
    >
      {children}
    </h3>
  );
}

interface CardBodyProps {
  className?: string;
  children: React.ReactNode;
}

export function CardBody({ className, children }: CardBodyProps) {
  return (
    <div className={twMerge('text-foreground', className)}>
      {children}
    </div>
  );
}
