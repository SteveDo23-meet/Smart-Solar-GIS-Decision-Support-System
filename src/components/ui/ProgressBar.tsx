import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
  height?: 'sm' | 'md' | 'lg';
}

const heightStyles = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  color = '#00d4ff',
  showLabel = false,
  animated = true,
  className = '',
  height = 'md',
}) => {
  const percentage = (value / max) * 100;

  return (
    <div className={className}>
      <div className={`w-full bg-dark-card rounded-full overflow-hidden ${heightStyles[height]}`}>
        {animated ? (
          <motion.div
            className="h-full rounded-full"
            style={{
              backgroundColor: color,
              boxShadow: `0 0 10px ${color}`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        ) : (
          <div
            className="h-full rounded-full"
            style={{
              width: `${percentage}%`,
              backgroundColor: color,
              boxShadow: `0 0 10px ${color}`,
            }}
          />
        )}
      </div>
      {showLabel && (
        <div className="text-sm text-gray-400 mt-1">
          {value.toFixed(0)} / {max.toFixed(0)}
        </div>
      )}
    </div>
  );
};
