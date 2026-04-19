import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'outline' | 'star' | 'fork';
  size?: 'sm' | 'md';
}

const VARIANTS: Record<string, string> = {
  default: 'bg-surface-active text-text-secondary',
  primary: 'bg-accent-light text-accent border border-accent/10',
  success: 'bg-fork-bg text-fork border border-fork-border',
  warning: 'bg-star-bg text-star border border-star-border',
  star: 'bg-star-bg text-star border border-star-border',
  fork: 'bg-fork-bg text-fork border border-fork-border',
  outline: 'border border-line text-text-secondary',
};

const SIZES: Record<string, string> = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-xs',
};

export function Badge({ 
  className, 
  variant = 'default', 
  size = 'sm',
  children,
  ...props 
}: BadgeProps) {
  return (
    <span 
      className={cn(
        'inline-flex items-center rounded-md font-medium tracking-tight',
        VARIANTS[variant] || VARIANTS.default,
        SIZES[size] || SIZES.sm,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
