import { motion } from 'framer-motion';

const legendItems = [
  { label: 'Parking', letter: 'P', color: '#38bdf8' },
  { label: 'Bus Station', letter: 'B', color: '#22d3ee' },
  { label: 'Public Building', letter: 'G', color: '#a3e635' },
  { label: 'Open Space', letter: 'O', color: '#facc15' },
  { label: 'Park / Recreation', letter: 'R', color: '#34d399' },
  { label: 'Transport / Paved', letter: 'T', color: '#60a5fa' },
];

export const MapLegend: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute left-4 top-24 z-30 hidden rounded-lg border border-white/10 bg-slate-950/70 p-3 shadow-2xl backdrop-blur-xl lg:block"
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Legend</p>
      <div className="space-y-2">
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs text-slate-200">
            <span
              className="grid h-6 w-6 place-items-center rounded-full border border-slate-950 text-[11px] font-bold text-white shadow-lg"
              style={{ backgroundColor: item.color }}
            >
              {item.letter}
            </span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
