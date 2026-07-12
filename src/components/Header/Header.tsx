import styles from './Header.module.css';

interface HeaderProps {
  subtitle: string;
  visibleCount: number;
  totalCount: number;
}

export default function Header({ subtitle, visibleCount, totalCount }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div>
        <h1 className={styles.title}>🦋 Summer Pockets 聖地巡礼マップ</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>
      <div className={styles.meta}>
        <span className={styles.count}>
          {visibleCount} / {totalCount} 件
        </span>
      </div>
    </header>
  );
}
