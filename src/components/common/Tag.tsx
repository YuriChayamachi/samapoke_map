import styles from './Tag.module.css';

interface TagProps {
  /** badges.csv の class 列や 'tag--area' / 'tag--cat' などの固定クラス名 */
  className: string;
  children: React.ReactNode;
}

// バッジ/エリア/カテゴリタグ共通の表示コンポーネント。className は CSV 駆動の
// 値がそのまま渡ってくる（Tag.module.css 側でも同じ名前を定義している）。
export default function Tag({ className, children }: TagProps) {
  const scoped = styles[className];
  return <span className={`${styles.tag} ${scoped ?? ''}`}>{children}</span>;
}
