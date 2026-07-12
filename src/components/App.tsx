import { useEffect, useMemo, useRef, useState } from 'react';
import Header from './Header/Header';
import Panel, { type PanelTab } from './Panel/Panel';
import MapView, { type MapViewHandle } from './Map/MapView';
import DetailPanel from './Detail/DetailPanel';
import { useFilters } from '../hooks/useFilters';
import { buildEnumMaps } from '../lib/format';
import { resolveRouteSpots } from '../lib/routes';
import type { AppData, PilgrimageRoute, Spot } from '../types/data';
import '../styles/global.css';

interface AppProps {
  data: AppData;
}

type MobileView = 'list' | 'map';

export default function App({ data }: AppProps) {
  const enumMaps = useMemo(() => buildEnumMaps(data.enums), [data.enums]);
  const spotById = useMemo(() => new Map(data.spots.map((s) => [s.id, s])), [data.spots]);

  const { filters, toggleArea, toggleCategory, toggleFlag, setQuery, reset, visibleSpots } =
    useFilters(data.spots);

  const [panelTab, setPanelTab] = useState<PanelTab>('list');
  const [mobileView, setMobileView] = useState<MobileView>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [popupSpotId, setPopupSpotId] = useState<string | null>(null);
  const [detailSpotId, setDetailSpotId] = useState<string | null>(null);
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);

  const mapViewRef = useRef<MapViewHandle>(null);

  const activeRoute = useMemo<PilgrimageRoute | null>(
    () => (activeRouteId ? data.routes.find((r) => r.id === activeRouteId) ?? null : null),
    [activeRouteId, data.routes],
  );
  // ルート選択中は地図のピンをそのルートのスポットに絞り、番号表示にする
  const activeRouteSpots = useMemo<Spot[] | null>(
    () => (activeRoute ? resolveRouteSpots(activeRoute, data.spots) : null),
    [activeRoute, data.spots],
  );
  const mapSpots = activeRouteSpots ?? visibleSpots;
  const orderMap = useMemo<Map<string, number> | null>(
    () => (activeRouteSpots ? new Map(activeRouteSpots.map((s, i) => [s.id, i + 1])) : null),
    [activeRouteSpots],
  );
  const detailSpot = detailSpotId ? spotById.get(detailSpotId) ?? null : null;

  // モバイルでリストビューのまま何かを表示しようとした場合、地図タブへ切替える
  const ensureMapVisibleOnMobile = () => setMobileView('map');

  useEffect(() => {
    document.body.classList.remove('view-list', 'view-map');
    document.body.classList.add(`view-${mobileView}`);
  }, [mobileView]);

  // Escape でパネル・ルート表示を閉じる
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (detailSpotId) {
        setDetailSpotId(null);
      } else if (activeRouteId) {
        setActiveRouteId(null);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [detailSpotId, activeRouteId]);

  // スポット選択（地図とカードを同期）
  function selectSpot(id: string, openDetailPanel: boolean) {
    setSelectedId(id);
    setPopupSpotId(id);
    const spot = spotById.get(id);
    if (spot && spot.lat != null && spot.lng != null) {
      mapViewRef.current?.flyToSpot(spot.lat, spot.lng, 14);
    }
    if (openDetailPanel) setDetailSpotId(id);
  }

  function handleCardSelect(id: string) {
    selectSpot(id, true);
  }

  function handleRouteStopSelect(id: string) {
    selectSpot(id, true);
    ensureMapVisibleOnMobile();
  }

  function handleMarkerClick(id: string) {
    setSelectedId(id);
    setPopupSpotId(id);
  }

  function handleLocateClick() {
    mapViewRef.current?.triggerLocate();
    ensureMapVisibleOnMobile();
  }

  function drawRoute(route: PilgrimageRoute) {
    if (activeRouteId === route.id) {
      setActiveRouteId(null);
      return;
    }
    setActiveRouteId(route.id);
    const coords: [number, number][] = resolveRouteSpots(route, data.spots).map((s) => [
      s.lng as number,
      s.lat as number,
    ]);
    mapViewRef.current?.fitToCoords(coords, 40);
    // モバイルでもスタック（左パネル）をそのまま見せる。地図への切替はスポット選択時のみ。
  }

  return (
    <>
      <Header subtitle={data.meta.subtitle} visibleCount={visibleSpots.length} totalCount={data.spots.length} />

      <nav className="mobile-tabs" aria-label="表示切替">
        <button
          type="button"
          className={`mobile-tabs__btn ${mobileView === 'list' ? 'is-active' : ''}`}
          onClick={() => setMobileView('list')}
        >
          📋 一覧
        </button>
        <button
          type="button"
          className={`mobile-tabs__btn ${mobileView === 'map' ? 'is-active' : ''}`}
          onClick={() => setMobileView('map')}
        >
          🗺️ 地図
        </button>
      </nav>

      <main className="layout">
        <Panel
          panelTab={panelTab}
          onPanelTabChange={setPanelTab}
          spots={data.spots}
          visibleSpots={visibleSpots}
          areas={data.enums.areas}
          badges={data.enums.badges}
          areaColorMap={enumMaps.areaColor}
          catIconMap={enumMaps.catIcon}
          filters={filters}
          onToggleArea={toggleArea}
          onToggleCategory={toggleCategory}
          onToggleFlag={toggleFlag}
          onQueryChange={setQuery}
          onReset={reset}
          onLocateClick={handleLocateClick}
          selectedId={selectedId}
          onSelectSpot={handleCardSelect}
          onSelectRouteStop={handleRouteStopSelect}
          routes={data.routes}
          activeRouteId={activeRouteId}
          onDrawRoute={drawRoute}
          onClearRoute={() => setActiveRouteId(null)}
        />

        <MapView
          ref={mapViewRef}
          spots={mapSpots}
          areaColorMap={enumMaps.areaColor}
          catIconMap={enumMaps.catIcon}
          badges={data.enums.badges}
          popupSpotId={popupSpotId}
          onMarkerClick={handleMarkerClick}
          onClosePopup={() => setPopupSpotId(null)}
          onOpenDetail={(id) => setDetailSpotId(id)}
          activeRouteSpots={activeRouteSpots}
          orderMap={orderMap}
        />
      </main>

      <DetailPanel
        spot={detailSpot}
        open={detailSpotId != null}
        badges={data.enums.badges}
        catIconMap={enumMaps.catIcon}
        precisionMap={enumMaps.precision}
        onClose={() => setDetailSpotId(null)}
      />

      {detailSpotId && <div className="overlay" onClick={() => setDetailSpotId(null)} />}
    </>
  );
}
