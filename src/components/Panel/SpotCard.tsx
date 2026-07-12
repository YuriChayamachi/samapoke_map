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
}

export default function SpotCard({ spot, selected, areaColor, catIcon, badges, onSelect }: SpotCardProps) {
  return (
    <li>
      <div
        className={`${styles.card} ${selected ? styles.cardSelected : ''}`}
        style={{ '--card-color': areaColor } as React.CSSProperties}
        onClick={() => onSelect(spot.id)}
      >
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
    </li>
  );
}
