import { Clock3, Power, Snowflake, SunMedium } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAnalysisContext } from '../../app/providers/AnalysisProvider';
import type { SolarSeason } from '../../types/solarTimeline';
import { Badge } from '../ui/Badge';
import { GlassCard } from '../ui/GlassCard';

const seasonOptions: Array<{ value: SolarSeason; label: string }> = [
  { value: 'winter', label: 'Winter' },
  { value: 'spring', label: 'Spring' },
  { value: 'summer', label: 'Summer' },
  { value: 'autumn', label: 'Autumn' },
];

const formatHour = (hour: number) => `${String(hour).padStart(2, '0')}:00`;

export const SolarTimelineControls: React.FC = () => {
  const { solarTimeline, setSolarTimeHour, setSolarSeason, setIsTimelineEnabled } = useAnalysisContext();

  return (
    <GlassCard className="overflow-x-hidden !p-4">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-amber-200">
              <Clock3 className="h-3.5 w-3.5" />
              Dynamic Timeline
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">{formatHour(solarTimeline.solarTimeHour)}</h2>
          </div>
          <button
            type="button"
            onClick={() => setIsTimelineEnabled(!solarTimeline.isTimelineEnabled)}
            className={`flex h-8 shrink-0 items-center gap-1 rounded-md border px-2 text-xs font-semibold ${
              solarTimeline.isTimelineEnabled
                ? 'border-lime-300/50 bg-lime-300/10 text-lime-100'
                : 'border-white/10 bg-white/[0.04] text-slate-400'
            }`}
          >
            <Power className="h-3.5 w-3.5" />
            {solarTimeline.isTimelineEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
            <span>06:00</span>
            <Badge variant={solarTimeline.isTimelineEnabled ? 'warning' : 'tertiary'} size="sm">
              {solarTimeline.isTimelineEnabled ? 'Timeline adjusted' : 'Original values'}
            </Badge>
            <span>18:00</span>
          </div>
          <input
            type="range"
            min={6}
            max={18}
            step={1}
            value={solarTimeline.solarTimeHour}
            onChange={(event) => setSolarTimeHour(Number(event.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-amber-300"
          />
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {seasonOptions.map((season) => {
            const active = solarTimeline.solarSeason === season.value;
            const Icon = season.value === 'winter' ? Snowflake : SunMedium;

            return (
              <button
                key={season.value}
                type="button"
                onClick={() => setSolarSeason(season.value)}
                className={`min-w-0 rounded-md border px-1.5 py-2 text-[11px] font-semibold transition ${
                  active
                    ? 'border-amber-300/60 bg-amber-300/15 text-amber-100 shadow-[0_0_18px_rgba(251,191,36,0.12)]'
                    : 'border-white/10 bg-white/[0.035] text-slate-400 hover:bg-white/[0.06]'
                }`}
              >
                <Icon className="mx-auto mb-1 h-3.5 w-3.5" />
                <span className="block truncate">{season.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </GlassCard>
  );
};
