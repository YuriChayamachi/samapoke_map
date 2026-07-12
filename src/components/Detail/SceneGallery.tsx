import { useState } from 'react';
import styles from './DetailPanel.module.css';
import type { Scene } from '../../types/data';

interface SceneGalleryProps {
  scenes: Scene[];
  spotName: string;
}

function SceneImage({ src, alt }: { src: string; alt: string }) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <figure className={styles.sceneFigure}>
      <img
        className={styles.sceneImg}
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setHidden(true)}
      />
    </figure>
  );
}

// 1スポット複数シーン。各シーン: 名前 → 画像（複数可）→ 説明
export default function SceneGallery({ scenes, spotName }: SceneGalleryProps) {
  return (
    <div className={`${styles.section} ${styles.scenes}`}>
      <p className={styles.label}>シーン（{scenes.length}）</p>
      {scenes.map((scene, i) => (
        <div key={i} className={styles.scene}>
          {scene.name && <p className={styles.sceneName}>{scene.name}</p>}
          {scene.images.length > 0 && (
            <div className={styles.sceneImages}>
              {scene.images.map((src) => (
                <SceneImage key={src} src={src} alt={scene.name || spotName} />
              ))}
            </div>
          )}
          {scene.description && <p className={styles.sceneDesc}>{scene.description}</p>}
        </div>
      ))}
    </div>
  );
}
