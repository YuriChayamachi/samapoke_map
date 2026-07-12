import { Marker, Popup } from 'react-map-gl/maplibre';
import styles from './SpotMarkers.module.css';
import Badges from '../common/Badges';
import { gmapsLink } from '../../lib/format';
import type { Badge, Spot } from '../../types/data';

interface SpotMarkersProps {
  spots: Spot[];
  areaColorMap: Record<string, string>;
  catIconMap: Record<string, string>;
  badges: Badge[];
  popupSpotId: string | null;
  onMarkerClick: (id: string) => void;
  onClosePopup: () => void;
  onOpenDetail: (id: string) => void;
}

export default function SpotMarkers({
  spots,
  areaColorMap,
  catIconMap,
  badges,
  popupSpotId,
  onMarkerClick,
  onClosePopup,
  onOpenDetail,
}: SpotMarkersProps) {
  const popupSpot = popupSpotId ? spots.find((s) => s.id === popupSpotId) : null;
  const link = popupSpot ? gmapsLink(popupSpot) : null;

  return (
    <>
      {spots
        .filter((s) => s.lat != null && s.lng != null)
        .map((s) => (
          <Marker
            key={s.id}
            longitude={s.lng as number}
            latitude={s.lat as number}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onMarkerClick(s.id);
            }}
          >
            <div
              className={`${styles.marker} ${s.priority ? styles.priority : ''}`}
              style={{ background: areaColorMap[s.area] || '#6b7785' }}
            >
              <span>{catIconMap[s.category] || '📌'}</span>
            </div>
          </Marker>
        ))}

      {popupSpot && popupSpot.lat != null && popupSpot.lng != null && (
        <Popup
          longitude={popupSpot.lng}
          latitude={popupSpot.lat}
          anchor="bottom"
          offset={28}
          maxWidth="230px"
          closeButton
          onClose={onClosePopup}
        >
          <div className={styles.popupName}>{popupSpot.name}</div>
          <div className={styles.popupGame}>{popupSpot.gameName}</div>
          <div className={styles.popupBadges}>
            <Badges spot={popupSpot} context="popup" badges={badges} />
          </div>
          <div className={styles.popupLinks}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onOpenDetail(popupSpot.id);
              }}
            >
              詳細
            </a>
            {link && (
              <a href={link} target="_blank" rel="noopener noreferrer">
                Google Maps
              </a>
            )}
          </div>
        </Popup>
      )}
    </>
  );
}
