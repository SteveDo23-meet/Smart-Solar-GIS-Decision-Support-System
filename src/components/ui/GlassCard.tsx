import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: 'primary' | 'secondary' | 'tertiary' | 'none';
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hover = false,
  glow = 'none',
  onClick,
}) => {
  let glassClasses = 'glass';
  if (hover) glassClasses += ' glass-hover';
  if (glow !== 'none') glassClasses += ` glow-${glow}`;

  return (
    <div
      className={`${glassClasses} p-6 ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
