import { useState } from 'react';
import styles from './SpotList.module.css';
import Tag from '../common/Tag';
import Badges from '../common/Badges';
import type { Badge, Spot } from '../../types/data';

interface SpotCardProps {
  spot: Spot;
  selected: boolean;
  areaColor: string;
  catIcon: string;
  badges: Badge[];
  onSelect: (id: string) => void;
  /** 巡礼ルートのスタック表示時に渡す通し番号。指定時は番号バッジ付きレイアウトになる */
  order?: number;
}

// クローラーが取得したスポット単独のサムネイル（refImage）を優先し、
// 無ければ紐づく先頭シーン（order昇順の1件目）の先頭画像を使う。
function thumbnailFor(spot: Spot): string | null {
  return spot.refImage || spot.scenes[0]?.images[0] || null;
}

function Thumbnail({ src, alt }: { src: string; alt: string }) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <img
      className={styles.thumb}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setHidden(true)}
    />
  );
}

export default function SpotCard({ spot, selected, areaColor, catIcon, badges, onSelect, order }: SpotCardProps) {
  const thumbnail = thumbnailFor(spot);

  return (
    <li>
      <div
        className={`${styles.card} ${styles.cardRow} ${selected ? styles.cardSelected : ''}`}
        style={{ '--card-color': areaColor } as React.CSSProperties}
        onClick={() => onSelect(spot.id)}
      >
        {order != null && <div className={styles.order}>{order}</div>}
        {thumbnail && <Thumbnail src={thumbnail} alt={spot.name} />}
        <div className={styles.cardBody}>
          <div className={styles.name}>{spot.name}</div>
          <div className={styles.game}>{spot.gameName}</div>
          <div className={styles.badges}>
            <Tag className="tag--area">{spot.area}</Tag>
            <Tag className="tag--cat">
              {catIcon} {spot.category}
            </Tag>
            <Badges spot={spot} context="list" badges={badges} />
          </div>
        </div>
      </div>
    </li>
  );
}
