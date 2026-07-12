import { Layer } from 'react-map-gl/maplibre';

// liberty スタイルはフェリー航路を描画しないため（ラスター OSM 時代は点線表示
// されていたもの）、OpenMapTiles の transportation(class=ferry) を点線で復活させる。
// name フィールドは transportation ではなく transportation_name 側にある。
// liberty スタイルの既存 openmaptiles ソースを参照するだけなので <Source> は不要。
export default function FerryLayers() {
  return (
    <>
      <Layer
        id="sp-ferry-line"
        type="line"
        source="openmaptiles"
        source-layer="transportation"
        filter={['==', ['get', 'class'], 'ferry']}
        layout={{ 'line-join': 'round', 'line-cap': 'round' }}
        paint={{
          'line-color': '#2e90e9',
          'line-width': 1.4,
          'line-dasharray': [3, 3],
          'line-opacity': 0.9,
        }}
      />
      <Layer
        id="sp-ferry-label"
        type="symbol"
        source="openmaptiles"
        source-layer="transportation_name"
        filter={['==', ['get', 'class'], 'ferry']}
        layout={{
          'symbol-placement': 'line',
          'text-field': ['get', 'name'],
          'text-font': ['Noto Sans Regular'],
          'text-size': 11,
          'text-letter-spacing': 0.05,
        }}
        paint={{
          'text-color': '#2e90e9',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.2,
        }}
      />
    </>
  );
}
