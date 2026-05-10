import { Car, Flame, Map as MapIcon, Satellite } from 'lucide-react';
import { motion } from 'framer-motion';
import type { MapMode } from '../../app/providers/MapProvider';

interface MapModeSelectorProps {
  value: MapMode;
  onChange: (mode: MapMode) => void;
}

const modes: Array<{ value: MapMode; label: string; icon: React.ElementType }> = [
  { value: 'explore', label: 'Explore', icon: MapIcon },
  { value: 'driving', label: 'Driving', icon: Car },
  { value: 'satellite', label: 'Satellite', icon: Satellite },
  { value: 'heatmap', label: 'Heatmap', icon: Flame },
];

export const MapModeSelector: React.FC<MapModeSelectorProps> = ({ value, onChange }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute left-1/2 top-4 z-30 hidden -translate-x-1/2 rounded-lg border border-white/10 bg-slate-950/72 p-1 shadow-2xl backdrop-blur-xl md:flex"
    >
      {modes.map((mode) => {
        const Icon = mode.icon;
        const active = value === mode.value;

        return (
          <button
            key={mode.value}
            type="button"
            onClick={() => onChange(mode.value)}
            className={`relative flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold transition ${
              active ? 'text-slate-950' : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
            }`}
          >
            {active && (
              <motion.span
                layoutId="map-mode-active"
                className="absolute inset-0 rounded-md bg-cyan-300 shadow-[0_0_22px_rgba(103,232,249,0.38)]"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              />
            )}
            <Icon className="relative h-4 w-4" />
            <span className="relative">{mode.label}</span>
          </button>
        );
      })}
    </motion.div>
  );
};
