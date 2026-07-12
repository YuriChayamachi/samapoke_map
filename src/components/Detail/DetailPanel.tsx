import styles from './DetailPanel.module.css';
import btnStyles from '../common/Button.module.css';
import Tag from '../common/Tag';
import Badges from '../common/Badges';
import SceneGallery from './SceneGallery';
import { gmapsLink } from '../../lib/format';
import type { Badge, Precision, Spot } from '../../types/data';

interface DetailPanelProps {
  spot: Spot | null;
  open: boolean;
  badges: Badge[];
  catIconMap: Record<string, string>;
  precisionMap: Record<string, Precision>;
  onClose: () => void;
}

export default function DetailPanel({
  spot,
  open,
  badges,
  catIconMap,
  precisionMap,
  onClose,
}: DetailPanelProps) {
  if (!spot) return null;

  const hasScenes = spot.scenes.length > 0;
  const link = gmapsLink(spot);
  const precision = spot.precision ? precisionMap[spot.precision] : null;

  return (
    <aside
      className={`${styles.panel} ${open ? styles.open : ''}`}
      aria-hidden={!open}
      aria-label="スポット詳細"
    >
      <button type="button" className={styles.close} aria-label="閉じる" onClick={onClose}>
        ×
      </button>
      <div className={styles.body}>
        <div className={styles.hero}>
          <h2 className={styles.name}>{spot.name}</h2>
          {spot.gameName && <div className={styles.game}>ゲーム内呼称: {spot.gameName}</div>}
          <div className={styles.badges}>
            <Tag className="tag--area">{spot.area}</Tag>
            <Tag className="tag--cat">
              {catIconMap[spot.category] || '📌'} {spot.category}
            </Tag>
            <Badges spot={spot} context="detail" badges={badges} />
          </div>
        </div>

        {hasScenes && <SceneGallery scenes={spot.scenes} spotName={spot.name} />}

        {/* 参考カット（公式サイト掲載画像への直リンク）。
            シーンギャラリーがあるスポットではシーン側が画像を担うため、無いスポットのみのフォールバック */}
        {!hasScenes && spot.refImage && (
          <div className={styles.section}>
            <p className={styles.label}>参考カット</p>
            <figure className={styles.refFigure}>
              <img
                className={styles.refImg}
                src={spot.refImage}
                alt={`${spot.name} 参考カット（公式サイトより）`}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
              <figcaption className={styles.refCaption}>
                {spot.officialUrl ? (
                  <a href={spot.officialUrl} target="_blank" rel="noopener noreferrer">
                    出典: 公式サイト ↗
                  </a>
                ) : (
                  '出典: 公式サイト（summer-pockets.main.jp）'
                )}
              </figcaption>
            </figure>
          </div>
        )}

        {spot.description && (
          <div className={styles.section}>
            <p className={styles.label}>説明</p>
            <p className={styles.text}>{spot.description}</p>
          </div>
        )}

        {spot.access && (
          <div className={styles.section}>
            <p className={styles.label}>アクセス</p>
            <p className={styles.text}>{spot.access}</p>
          </div>
        )}

        {spot.warnings.length > 0 && (
          <div className={`${styles.section} ${styles.warn}`}>
            <p className={styles.label}>注意事項</p>
            <ul>
              {spot.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.section}>
          <p className={styles.label}>GPS 座標</p>
          {spot.lat != null && spot.lng != null ? (
            <p className={`${styles.text} ${styles.coords}`}>
              {spot.lat}, {spot.lng}
              {precision && (
                <span style={{ marginLeft: 8 }}>
                  <Tag className={precision.class}>{precision.label}</Tag>
                </span>
              )}
            </p>
          ) : (
            <p className={styles.text}>未特定（地図には表示されません）</p>
          )}
        </div>

        {spot.address && (
          <div className={styles.section}>
            <p className={styles.label}>住所</p>
            <p className={styles.text}>{spot.address}</p>
          </div>
        )}

        {spot.reliability != null && (
          <div className={styles.section}>
            <p className={styles.label}>情報信頼度</p>
            <p className={styles.text}>
              <span className={styles.stars}>{'★'.repeat(spot.reliability)}</span>
              <span className={styles.starsOff}>{'☆'.repeat(5 - spot.reliability)}</span>
            </p>
          </div>
        )}

        <div className={styles.actions}>
          {link && (
            <a
              className={`${btnStyles.btn} ${btnStyles.primary}`}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
            >
              🗺️ Google Maps で開く
            </a>
          )}
        </div>
      </div>
    </aside>
  );
}
