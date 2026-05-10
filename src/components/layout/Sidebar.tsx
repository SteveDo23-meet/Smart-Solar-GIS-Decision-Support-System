import { EnergyChart } from '../dashboard/EnergyChart';
import { ScoreBreakdown } from '../dashboard/ScoreBreakdown';
import { TopLocations } from '../dashboard/TopLocations';

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  return (
    <aside className={`space-y-3 overflow-y-auto ${className}`}>
      <TopLocations limit={4} />
      <ScoreBreakdown />
      <EnergyChart chartType="area" />
    </aside>
  );
};
