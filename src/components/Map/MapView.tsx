import { forwardRef, useImperativeHandle, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import Map, { GeolocateControl, ScaleControl } from 'react-map-gl/maplibre';
import type { MapRef, GeolocateControlInstance } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import FerryLayers from './FerryLayers';
import SpotMarkers from './SpotMarkers';
import RouteLayer from './RouteLayer';
import type { Badge, PilgrimageRoute, Spot } from '../../types/data';

export interface MapViewHandle {
  flyToSpot(lat: number, lng: number, minZoom?: number): void;
  fitToCoords(coords: [number, number][], paddingPx?: number): void;
  triggerLocate(): void;
}

interface MapViewProps {
  allSpots: Spot[];
  visibleSpots: Spot[];
  areaColorMap: Record<string, string>;
  catIconMap: Record<string, string>;
  badges: Badge[];
  popupSpotId: string | null;
  onMarkerClick: (id: string) => void;
  onClosePopup: () => void;
  onOpenDetail: (id: string) => void;
  activeRoute: PilgrimageRoute | null;
  onRouteWaypointClick: (id: string) => void;
}

// 基盤地図は OpenFreeMap のベクトルタイルを MapLibre GL（react-map-gl）で描画する。
// 日本語字形はラスターと違いクライアント側で描画されるため、localIdeographFontFamily
// で端末の日本語フォントを使い、CJK 統合漢字が中国語字形へフォールバックするのを防ぐ。
const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(
  {
    allSpots,
    visibleSpots,
    areaColorMap,
    catIconMap,
    badges,
    popupSpotId,
    onMarkerClick,
    onClosePopup,
    onOpenDetail,
    activeRoute,
    onRouteWaypointClick,
  },
  ref,
) {
  const mapRef = useRef<MapRef>(null);
  const geolocateRef = useRef<GeolocateControlInstance>(null);

  useImperativeHandle(ref, () => ({
    flyToSpot(lat, lng, minZoom = 14) {
      const map = mapRef.current?.getMap();
      if (!map) return;
      const zoom = Math.max(map.getZoom(), minZoom);
      map.flyTo({ center: [lng, lat], zoom, essential: true });
    },
    fitToCoords(coords, paddingPx = 40) {
      const map = mapRef.current?.getMap();
      if (!map || coords.length === 0) return;
      const bounds = coords.reduce(
        (b, c) => b.extend(c),
        new maplibregl.LngLatBounds(coords[0], coords[0]),
      );
      map.fitBounds(bounds, { padding: paddingPx });
    },
    triggerLocate() {
      geolocateRef.current?.trigger();
    },
  }));

  return (
    <section className="layout-map" id="map-wrap" aria-label="地図">
      <Map
        ref={mapRef}
        id="map"
        initialViewState={{ longitude: 134.03, latitude: 34.41, zoom: 11 }}
        mapStyle="https://tiles.openfreemap.org/styles/liberty"
        localIdeographFontFamily="'Hiragino Sans','Noto Sans CJK JP','Yu Gothic',sans-serif"
        attributionControl={{
          customAttribution: [
            '<a href="https://openfreemap.org" rel="noopener noreferrer">OpenFreeMap</a>',
            '&copy; <a href="https://www.openmaptiles.org/" rel="noopener noreferrer">OpenMapTiles</a>',
            'Data from <a href="https://www.openstreetmap.org/copyright" rel="noopener noreferrer">OpenStreetMap</a>',
          ],
        }}
        style={{ width: '100%', height: '100%', minHeight: 320, background: 'var(--sky)' }}
      >
        <ScaleControl position="bottom-right" unit="metric" />
        <GeolocateControl
          ref={geolocateRef}
          position="top-right"
          trackUserLocation
          showUserLocation
          showAccuracyCircle
          positionOptions={{ enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }}
        />

        <FerryLayers />

        <SpotMarkers
          spots={visibleSpots}
          areaColorMap={areaColorMap}
          catIconMap={catIconMap}
          badges={badges}
          popupSpotId={popupSpotId}
          onMarkerClick={onMarkerClick}
          onClosePopup={onClosePopup}
          onOpenDetail={onOpenDetail}
        />

        {activeRoute && (
          <RouteLayer route={activeRoute} spots={allSpots} onWaypointClick={onRouteWaypointClick} />
        )}
      </Map>
    </section>
  );
});

export default MapView;
