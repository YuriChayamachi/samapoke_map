import { Marker, Source, Layer } from 'react-map-gl/maplibre';
import type { Feature, LineString } from 'geojson';
import styles from './RouteLayer.module.css';
import { resolveRouteSpots } from '../../lib/routes';
import type { PilgrimageRoute, Spot } from '../../types/data';

interface RouteLayerProps {
  route: PilgrimageRoute;
  spots: Spot[];
  onWaypointClick: (id: string) => void;
}

// 地図上に順路（線 + 番号付き経由地マーカー、始点=🚩緑・終点=🏁赤）を描画
export default function RouteLayer({ route, spots, onWaypointClick }: RouteLayerProps) {
  const routeSpots = resolveRouteSpots(route, spots);

  if (routeSpots.length === 0) return null;

  const coordinates: [number, number][] = routeSpots.map((s) => [s.lng as number, s.lat as number]);
  const geojson: Feature<LineString> = {
    type: 'Feature',
    properties: {},
    geometry: { type: 'LineString', coordinates },
  };

  return (
    <>
      {/* 白いケーシング + 本線を重ねて背景地図上でも視認しやすくする */}
      <Source id="sp-route" type="geojson" data={geojson}>
        <Layer
          id="sp-route-casing"
          type="line"
          layout={{ 'line-join': 'round', 'line-cap': 'round' }}
          paint={{ 'line-color': '#ffffff', 'line-width': 7, 'line-opacity': 0.9 }}
        />
        <Layer
          id="sp-route-line"
          type="line"
          layout={{ 'line-join': 'round', 'line-cap': 'round' }}
          paint={{ 'line-color': '#1f5e8a', 'line-width': 4, 'line-opacity': 0.85 }}
        />
      </Source>

      {routeSpots.map((spot, i) => {
        const isStart = i === 0;
        const isGoal = routeSpots.length > 1 && i === routeSpots.length - 1;
        const label = isStart ? '🚩' : isGoal ? '🏁' : String(i + 1);
        const tooltip = (isStart ? 'スタート: ' : isGoal ? 'ゴール: ' : `${i + 1}. `) + spot.name;
        return (
          <Marker
            key={spot.id}
            longitude={spot.lng as number}
            latitude={spot.lat as number}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onWaypointClick(spot.id);
            }}
          >
            <div
              className={`${styles.wp} ${isStart ? styles.start : isGoal ? styles.goal : ''}`}
              title={tooltip}
            >
              <span>{label}</span>
            </div>
          </Marker>
        );
      })}
    </>
  );
}
