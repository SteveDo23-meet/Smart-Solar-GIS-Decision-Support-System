import { Marker, Polygon as GooglePolygon, Polyline } from '@react-google-maps/api';
import { MousePointer2 } from 'lucide-react';
import { useMapContext } from '../../app/providers/MapProvider';
import type { Bounds } from '../../utils/geo';
import { coordinateToPercent, getPolygonCenter } from '../../utils/geo';

interface PolygonEditorProps {
  mode?: 'google' | 'fallback';
  bounds?: Bounds;
}

export const PolygonEditor: React.FC<PolygonEditorProps> = ({ mode = 'google', bounds }) => {
  const { polygon, polygonPoints, planningAreas, isDrawing } = useMapContext();

  if (!polygonPoints.length && !planningAreas.length && !isDrawing) return null;

  if (mode === 'fallback' && bounds) {
    const points = polygonPoints.map((point) => coordinateToPercent(point, bounds));
    const svgPoints = points.map((point) => `${point.x},${point.y}`).join(' ');

    return (
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {points.length > 1 && (
          <polyline points={svgPoints} fill="none" stroke="#67e8f9" strokeWidth="0.35" strokeDasharray="1 0.8" />
        )}
        {points.length > 2 && (
          <polygon points={svgPoints} fill="rgba(14, 165, 233, 0.16)" stroke="#22d3ee" strokeWidth="0.45" />
        )}
        {points.map((point, index) => (
          <circle key={index} cx={point.x} cy={point.y} r="0.9" fill="#ecfeff" stroke="#0891b2" strokeWidth="0.25" />
        ))}
      </svg>
    );
  }

  const googlePath = polygonPoints.map((point) => ({ lat: point.lat, lng: point.lng }));

  return (
    <>
      {planningAreas.map((area, index) => (
        <GooglePolygon
          key={area.id}
          path={area.points}
          options={{
            strokeColor: index === planningAreas.length - 1 ? '#22d3ee' : '#a78bfa',
            strokeOpacity: 0.95,
            strokeWeight: 2,
            fillColor: index === planningAreas.length - 1 ? '#06b6d4' : '#8b5cf6',
            fillOpacity: index === planningAreas.length - 1 ? 0.18 : 0.12,
            clickable: false,
            zIndex: 5,
          }}
        />
      ))}

      {planningAreas.map((area) => (
        <Marker
          key={`${area.id}-label`}
          position={getPolygonCenter(area.polygon)}
          label={{ text: area.label.replace('Area ', 'A'), color: '#0f172a', fontSize: '11px', fontWeight: '800' }}
          title={area.label}
        />
      ))}

      {polygon && planningAreas.length === 0 && (
        <GooglePolygon
          path={googlePath}
          options={{
            strokeColor: '#22d3ee',
            strokeOpacity: 0.95,
            strokeWeight: 2,
            fillColor: '#06b6d4',
            fillOpacity: 0.18,
            clickable: false,
            zIndex: 5,
          }}
        />
      )}

      {!polygon && polygonPoints.length > 1 && (
        <Polyline
          path={googlePath}
          options={{
            strokeColor: '#67e8f9',
            strokeOpacity: 0.95,
            strokeWeight: 2,
            clickable: false,
            zIndex: 5,
          }}
        />
      )}

      {polygonPoints.map((point, index) => (
        <Marker
          key={`${point.lat}-${point.lng}-${index}`}
          position={point}
          label={{ text: String(index + 1), color: '#0f172a', fontSize: '11px', fontWeight: '700' }}
          title={`Polygon vertex ${index + 1}`}
        />
      ))}

      {isDrawing && (
        <div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-2 rounded-lg border border-cyan-300/25 bg-slate-950/70 px-3 py-2 text-xs text-cyan-100 backdrop-blur-xl">
          <MousePointer2 className="h-4 w-4 text-cyan-300" />
          Use the polygon tool on the map to draw the planning area
        </div>
      )}
    </>
  );
};
