import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantStyles = {
  primary: 'bg-accent-primary/20 text-accent-primary border border-accent-primary/50',
  secondary: 'bg-accent-secondary/20 text-accent-secondary border border-accent-secondary/50',
  tertiary: 'bg-accent-tertiary/20 text-accent-tertiary border border-accent-tertiary/50',
  success: 'bg-green-500/20 text-green-400 border border-green-500/50',
  warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50',
  danger: 'bg-red-500/20 text-red-400 border border-red-500/50',
};

const sizeStyles = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
}) => {
  return (
    <span
      className={`inline-block rounded-full font-semibold ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};
