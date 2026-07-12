import { useMemo, useRef } from 'react';
import styles from './Filters.module.css';
import btnStyles from '../common/Button.module.css';
import type { Area, Spot } from '../../types/data';
import type { FilterState, OnlyFlagKey } from '../../hooks/useFilters';

interface FiltersProps {
  spots: Spot[];
  areas: Area[]; // areas.csv の order 列で既にソート済み
  filters: FilterState;
  areaColorMap: Record<string, string>;
  catIconMap: Record<string, string>;
  onToggleArea: (area: string) => void;
  onToggleCategory: (category: string) => void;
  onToggleFlag: (key: OnlyFlagKey) => void;
  onQueryChange: (query: string) => void;
  onReset: () => void;
  onLocateClick: () => void;
}

const TOGGLE_DEFS: { key: OnlyFlagKey; label: string }[] = [
  { key: 'onlyWarning', label: '⚠ 注意あり' },
  { key: 'onlyAnime', label: '🆕 アニメ新規' },
  { key: 'onlyPriority', label: '★ 主要聖地' },
  { key: 'onlyAnimeSrc', label: '📺 アニメ' },
  { key: 'onlyGameSrc', label: '🎮 ゲーム' },
  { key: 'onlyGuide', label: '🗺 聖地巡礼ガイド' },
];

export default function Filters({
  spots,
  areas,
  filters,
  areaColorMap,
  catIconMap,
  onToggleArea,
  onToggleCategory,
  onToggleFlag,
  onQueryChange,
  onReset,
  onLocateClick,
}: FiltersProps) {
  const visibleAreas = useMemo(
    () => areas.filter((a) => spots.some((s) => s.area === a.area)),
    [areas, spots],
  );

  const categories = useMemo(() => {
    const set = new Set<string>();
    spots.forEach((s) => set.add(s.category));
    return Array.from(set).sort();
  }, [spots]);

  const searchRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    if (searchRef.current) searchRef.current.value = '';
    onReset();
  };

  return (
    <div className={styles.filters}>
      <input
        ref={searchRef}
        type="search"
        className={styles.search}
        placeholder="🔍 名前・ゲーム内呼称・住所で検索"
        autoComplete="off"
        // 入力中に query state（trim + lowercase 済み）へ再同期して value を書き戻すと
        // カーソル位置や大文字入力が乱れるため、非制御コンポーネントとして扱う。
        onChange={(e) => onQueryChange(e.target.value)}
      />

      <div className={styles.group} aria-label="エリアで絞り込み">
        {visibleAreas.map((a) => (
          <button
            key={a.area}
            type="button"
            className={`${styles.chip} ${styles.chipArea} ${filters.areas.has(a.area) ? styles.chipActive : ''}`}
            style={{ '--chip-color': areaColorMap[a.area] } as React.CSSProperties}
            onClick={() => onToggleArea(a.area)}
          >
            <span className={styles.chipDot} style={{ background: areaColorMap[a.area] }} />
            {a.area}
          </button>
        ))}
      </div>

      <details className={styles.more}>
        <summary>カテゴリ・条件で絞り込み</summary>
        <div className={styles.group} aria-label="カテゴリで絞り込み">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className={`${styles.chip} ${filters.categories.has(c) ? styles.chipActive : ''}`}
              onClick={() => onToggleCategory(c)}
            >
              {catIconMap[c] || '📌'} {c}
            </button>
          ))}
        </div>
        <div className={styles.group} aria-label="条件で絞り込み">
          {TOGGLE_DEFS.map((def) => (
            <button
              key={def.key}
              type="button"
              className={`${styles.chip} ${filters[def.key] ? styles.chipActive : ''}`}
              onClick={() => onToggleFlag(def.key)}
            >
              {def.label}
            </button>
          ))}
        </div>
      </details>

      <div className={styles.actions}>
        <button type="button" className={`${btnStyles.btn} ${btnStyles.ghost}`} onClick={handleReset}>
          フィルタをリセット
        </button>
        <button type="button" className={`${btnStyles.btn} ${btnStyles.ghost}`} onClick={onLocateClick}>
          🧭 現在地
        </button>
      </div>
    </div>
  );
}
