import { POI_TYPE_COLORS } from '../../data/mockPois';
import type { POI } from '../../data/mockPois';
import type { Bounds } from '../../utils/geo';
import { coordinateToPercent } from '../../utils/geo';
import { calculateSolarScore } from '../../utils/scoring';

interface HeatmapOverlayProps {
  pois: POI[];
  bounds: Bounds;
}

export const HeatmapOverlay: React.FC<HeatmapOverlayProps> = ({ pois, bounds }) => {
  return (
    <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden mix-blend-screen">
      {pois.map((poi) => {
        const position = coordinateToPercent(poi, bounds);
        const score = calculateSolarScore(poi);
        const size = 70 + score * 0.95;
        const color = POI_TYPE_COLORS[poi.type];

        return (
          <div
            key={poi.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              width: size,
              height: size,
              opacity: 0.16 + score / 480,
              background: `radial-gradient(circle, ${color} 0%, ${color}88 34%, transparent 72%)`,
            }}
          />
        );
      })}
    </div>
  );
};
