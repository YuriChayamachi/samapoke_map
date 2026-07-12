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

export default function SpotCard({ spot, selected, areaColor, catIcon, badges, onSelect, order }: SpotCardProps) {
  return (
    <li>
      <div
        className={`${styles.card} ${order != null ? styles.cardNumbered : ''} ${selected ? styles.cardSelected : ''}`}
        style={{ '--card-color': areaColor } as React.CSSProperties}
        onClick={() => onSelect(spot.id)}
      >
        {order != null && <div className={styles.order}>{order}</div>}
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
