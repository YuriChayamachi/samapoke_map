import styles from './Panel.module.css';
import Filters from './Filters';
import SpotList from './SpotList';
import RoutesPanel from './RoutesPanel';
import type { Area, Badge, PilgrimageRoute, Spot } from '../../types/data';
import type { FilterState, OnlyFlagKey } from '../../hooks/useFilters';

export type PanelTab = 'list' | 'routes';

interface PanelProps {
  panelTab: PanelTab;
  onPanelTabChange: (tab: PanelTab) => void;

  spots: Spot[];
  visibleSpots: Spot[];
  areas: Area[];
  badges: Badge[];
  areaColorMap: Record<string, string>;
  catIconMap: Record<string, string>;

  filters: FilterState;
  onToggleArea: (area: string) => void;
  onToggleCategory: (category: string) => void;
  onToggleFlag: (key: OnlyFlagKey) => void;
  onQueryChange: (query: string) => void;
  onReset: () => void;
  onLocateClick: () => void;

  selectedId: string | null;
  onSelectSpot: (id: string) => void;
  onSelectRouteStop: (id: string) => void;

  routes: PilgrimageRoute[];
  activeRouteId: string | null;
  onDrawRoute: (route: PilgrimageRoute) => void;
  onClearRoute: () => void;
}

export default function Panel({
  panelTab,
  onPanelTabChange,
  spots,
  visibleSpots,
  areas,
  badges,
  areaColorMap,
  catIconMap,
  filters,
  onToggleArea,
  onToggleCategory,
  onToggleFlag,
  onQueryChange,
  onReset,
  onLocateClick,
  selectedId,
  onSelectSpot,
  onSelectRouteStop,
  routes,
  activeRouteId,
  onDrawRoute,
  onClearRoute,
}: PanelProps) {
  return (
    <section className="layout-panel" id="panel" aria-label="スポット一覧・巡礼ルート">
      <div className={styles.tabs} role="tablist">
        <button
          type="button"
          className={`${styles.tabBtn} ${panelTab === 'list' ? styles.active : ''}`}
          role="tab"
          aria-selected={panelTab === 'list'}
          onClick={() => onPanelTabChange('list')}
        >
          📋 スポット一覧
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${panelTab === 'routes' ? styles.active : ''}`}
          role="tab"
          aria-selected={panelTab === 'routes'}
          onClick={() => onPanelTabChange('routes')}
        >
          🚶 巡礼ルート
        </button>
      </div>

      <div className={styles.view} hidden={panelTab !== 'list'}>
        <Filters
          spots={spots}
          areas={areas}
          filters={filters}
          areaColorMap={areaColorMap}
          catIconMap={catIconMap}
          onToggleArea={onToggleArea}
          onToggleCategory={onToggleCategory}
          onToggleFlag={onToggleFlag}
          onQueryChange={onQueryChange}
          onReset={onReset}
          onLocateClick={onLocateClick}
        />
        <SpotList
          spots={visibleSpots}
          selectedId={selectedId}
          areaColorMap={areaColorMap}
          catIconMap={catIconMap}
          badges={badges}
          onSelect={onSelectSpot}
        />
      </div>

      <div className={styles.view} hidden={panelTab !== 'routes'}>
        <RoutesPanel
          routes={routes}
          spots={spots}
          activeRoute={routes.find((r) => r.id === activeRouteId) ?? null}
          areaColorMap={areaColorMap}
          catIconMap={catIconMap}
          badges={badges}
          selectedId={selectedId}
          onSelectRoute={onDrawRoute}
          onClearRoute={onClearRoute}
          onSelectSpot={onSelectRouteStop}
        />
      </div>
    </section>
  );
}
