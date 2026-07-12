import { Fragment } from 'react';
import styles from './RoutesPanel.module.css';
import listStyles from './SpotList.module.css';
import btnStyles from '../common/Button.module.css';
import RouteCard from './RouteCard';
import SpotCard from './SpotCard';
import { flattenRouteStops, resolveRouteSpots } from '../../lib/routes';
import type { Badge, PilgrimageRoute, Spot } from '../../types/data';

interface RoutesPanelProps {
  routes: PilgrimageRoute[];
  spots: Spot[];
  activeRoute: PilgrimageRoute | null;
  areaColorMap: Record<string, string>;
  catIconMap: Record<string, string>;
  badges: Badge[];
  selectedId: string | null;
  onSelectRoute: (route: PilgrimageRoute) => void;
  onClearRoute: () => void;
  onSelectSpot: (id: string) => void;
}

// 左パネルの「🚶 巡礼ルート」タブ。スタック的な2階層になっている:
// - 未選択時: ルート名+説明のカード一覧（Level 0）
// - 選択時:   そのルートのスポットを通し番号付き SpotCard で上から順に表示し、
//             カードの間に所要時間を挟む（Level 1。実際の描画/絞り込みは
//             Map/RouteLayer・SpotMarkers が担当し、ここでは選択状態を持つだけ）。
export default function RoutesPanel({
  routes,
  spots,
  activeRoute,
  areaColorMap,
  catIconMap,
  badges,
  selectedId,
  onSelectRoute,
  onClearRoute,
  onSelectSpot,
}: RoutesPanelProps) {
  if (!activeRoute) {
    return (
      <div className={styles.body}>
        <p className={styles.intro}>ルートを選ぶと、順路と各スポットが上から順番に表示されます。</p>
        <ul className={listStyles.list} aria-label="巡礼ルート一覧">
          {routes.map((route) => (
            <RouteCard key={route.id} route={route} onSelect={onSelectRoute} />
          ))}
        </ul>
      </div>
    );
  }

  const routeSpots = resolveRouteSpots(activeRoute, spots);
  const travelById = new Map(flattenRouteStops(activeRoute).map((stop) => [stop.id, stop.travel]));

  return (
    <div className={styles.body}>
      <button type="button" className={`${btnStyles.btn} ${btnStyles.ghost} ${styles.backBtn}`} onClick={onClearRoute}>
        ← 巡礼ルート一覧
      </button>

      <div className={styles.routeHead}>
        <div className={styles.routeName}>{activeRoute.name}</div>
        <p className={styles.routeNote}>{activeRoute.note}</p>
      </div>

      <ul className={listStyles.list} aria-label={`${activeRoute.name}のスポット`}>
        {routeSpots.map((spot, i) => {
          const travel = travelById.get(spot.id);
          const isLast = i === routeSpots.length - 1;
          return (
            <Fragment key={spot.id}>
              <SpotCard
                spot={spot}
                order={i + 1}
                selected={spot.id === selectedId}
                areaColor={areaColorMap[spot.area] || '#6b7785'}
                catIcon={catIconMap[spot.category] || '📌'}
                badges={badges}
                onSelect={onSelectSpot}
              />
              {travel && !isLast && <li className={styles.travel}>{travel}</li>}
            </Fragment>
          );
        })}
      </ul>
    </div>
  );
}
