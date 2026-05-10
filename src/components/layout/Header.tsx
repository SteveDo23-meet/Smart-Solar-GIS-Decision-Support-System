import { Activity, CloudSun, DatabaseZap, ShieldCheck, Zap } from 'lucide-react';
import { useAnalysisContext } from '../../app/providers/AnalysisProvider';

interface HeaderProps {
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  const { analysis } = useAnalysisContext();

  return (
    <header className={`flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-slate-950/70 px-4 py-3 shadow-2xl backdrop-blur-xl ${className}`}>
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg border border-cyan-300/40 bg-cyan-300/10 shadow-[0_0_24px_rgba(34,211,238,0.18)]">
          <Zap className="h-5 w-5 text-cyan-200" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold tracking-wide text-white">SolarGrid Tel Aviv</h1>
          <p className="truncate text-xs text-slate-400">Google Maps solar planning layer</p>
        </div>
      </div>

      <div className="hidden items-center gap-2 xl:flex">
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-xs text-slate-300">
          <CloudSun className="h-4 w-4 text-amber-200" />
          {analysis?.weather.condition ?? 'Clear coastal sun'} / {analysis?.weather.temperatureC ?? 27}C
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-xs text-slate-300">
          <Activity className="h-4 w-4 text-lime-200" />
          Irradiance {analysis?.weather.irradianceWm2 ?? 948} W/m2
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-lime-300/25 bg-lime-300/10 px-3 py-2 text-xs font-semibold text-lime-100">
          <ShieldCheck className="h-4 w-4" />
          Mock engine online
        </div>
        <DatabaseZap className="h-5 w-5 text-cyan-300" />
      </div>
    </header>
  );
};
