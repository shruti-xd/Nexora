import React from 'react';
import { cn } from '../../utils/cn';

// =============================================================================
// Avatar UI Component
// Renders user avatar image or initials fallback
// =============================================================================

export interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, src, size = 'md', className }) => {
  // Step 1: Compute initials from full name
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  const sizeStyles = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover border border-surface-200', sizeStyles[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-brand-100 text-brand-800 font-semibold flex items-center justify-center border border-brand-200 select-none',
        sizeStyles[size],
        className
      )}
    >
      {initials}
    </div>
  );
};
