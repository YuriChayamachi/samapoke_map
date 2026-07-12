import styles from './SpotList.module.css';
import { flattenRouteStops } from '../../lib/routes';
import type { PilgrimageRoute } from '../../types/data';

interface RouteCardProps {
  route: PilgrimageRoute;
  onSelect: (route: PilgrimageRoute) => void;
}

// 「🚶 巡礼ルート」タブの一覧（未選択時）に並ぶ、ルート名+説明のカード。
// SpotCard と見た目を揃えるため SpotList.module.css のクラスを共用する。
export default function RouteCard({ route, onSelect }: RouteCardProps) {
  const stopCount = flattenRouteStops(route).length;

  return (
    <li>
      <div
        className={styles.card}
        style={{ '--card-color': 'var(--sea)' } as React.CSSProperties}
        onClick={() => onSelect(route)}
      >
        <div className={styles.name}>{route.name}</div>
        <div className={styles.game}>{route.note}</div>
        <div className={styles.badges}>
          <span className={styles.stopCountTag}>📍 {stopCount}箇所</span>
        </div>
      </div>
    </li>
  );
}
