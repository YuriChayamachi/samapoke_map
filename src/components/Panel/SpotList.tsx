import styles from './SpotList.module.css';
import SpotCard from './SpotCard';
import type { Badge, Spot } from '../../types/data';

interface SpotListProps {
  spots: Spot[];
  selectedId: string | null;
  areaColorMap: Record<string, string>;
  catIconMap: Record<string, string>;
  badges: Badge[];
  onSelect: (id: string) => void;
}

export default function SpotList({ spots, selectedId, areaColorMap, catIconMap, badges, onSelect }: SpotListProps) {
  if (spots.length === 0) {
    return (
      <ul className={styles.list} aria-label="スポット一覧">
        <li className={styles.empty}>該当するスポットはありません</li>
      </ul>
    );
  }

  return (
    <ul className={styles.list} aria-label="スポット一覧">
      {spots.map((s) => (
        <SpotCard
          key={s.id}
          spot={s}
          selected={s.id === selectedId}
          areaColor={areaColorMap[s.area] || '#6b7785'}
          catIcon={catIconMap[s.category] || '📌'}
          badges={badges}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}
