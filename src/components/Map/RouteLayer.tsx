import { Source, Layer } from 'react-map-gl/maplibre';
import type { Feature, LineString } from 'geojson';
import type { Spot } from '../../types/data';

interface RouteLayerProps {
  /** アクティブな巡礼ルートの、順序解決済みスポット一覧（App 側で resolveRouteSpots 済み） */
  routeSpots: Spot[];
}

// 地図上に巡礼ルートの順路（線のみ）を描画する。
// スポットのピン自体は SpotMarkers が担当し、番号表示に切り替わる（App.tsx の orderMap 経由）。
export default function RouteLayer({ routeSpots }: RouteLayerProps) {
  if (routeSpots.length < 2) return null;

  const coordinates: [number, number][] = routeSpots.map((s) => [s.lng as number, s.lat as number]);
  const geojson: Feature<LineString> = {
    type: 'Feature',
    properties: {},
    geometry: { type: 'LineString', coordinates },
  };

  return (
    // 白いケーシング + 本線を重ねて背景地図上でも視認しやすくする
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
  );
}
