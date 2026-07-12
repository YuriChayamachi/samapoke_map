import styles from './RoutesPanel.module.css';
import btnStyles from '../common/Button.module.css';
import type { PilgrimageRoute, Spot } from '../../types/data';

interface RoutesPanelProps {
  routes: PilgrimageRoute[];
  spots: Spot[];
  activeRouteId: string | null;
  onDrawRoute: (route: PilgrimageRoute) => void;
  onClearRoute: () => void;
  onSelectSpot: (id: string) => void;
}

// 左パネルの「🚶 巡礼ルート」タブ。ルート名クリックで地図上に順路を描画する
// （実際の描画は Map/RouteLayer が担当し、ここでは onDrawRoute を呼ぶだけ）。
export default function RoutesPanel({
  routes,
  spots,
  activeRouteId,
  onDrawRoute,
  onClearRoute,
  onSelectSpot,
}: RoutesPanelProps) {
  const spotById = new Map(spots.map((s) => [s.id, s]));

  return (
    <div className={styles.body}>
      <p className={styles.intro}>
        ルート名をタップすると、地図上に順路（スタート🚩→ゴール🏁）が表示されます。
      </p>

      <button
        type="button"
        className={`${btnStyles.btn} ${btnStyles.ghost} ${styles.clearBtn}`}
        hidden={!activeRouteId}
        onClick={onClearRoute}
      >
        ✕ ルート表示を解除
      </button>

      {routes.map((route) => {
        const isActive = activeRouteId === route.id;
        return (
          <div key={route.id} className={`${styles.route} ${isActive ? styles.routeActive : ''}`}>
            <button type="button" className={styles.routeTitle} onClick={() => onDrawRoute(route)}>
              {route.name}
            </button>
            <p className={styles.routeNote}>{route.note}</p>

            {route.days.map((day) => (
              <div key={day.label} className={styles.day}>
                <div className={styles.dayHead}>
                  {day.label}: {day.title}
                </div>
                <div className={styles.dayNote}>{day.note}</div>
                <div className={styles.stops}>
                  {day.stops.map((stop, i) => {
                    const spot = spotById.get(stop.id);
                    if (!spot) return null;
                    return (
                      <span key={stop.id}>
                        <button
                          type="button"
                          className={styles.stop}
                          onClick={() => onSelectSpot(stop.id)}
                        >
                          {spot.name}
                        </button>
                        {stop.travel && i < day.stops.length - 1 && (
                          <span className={styles.travel}>{stop.travel}</span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
