# samapoke_map — Summer Pockets 聖地巡礼マップ

Summer Pockets（サマポケ）聖地巡礼の地図・スポット一覧ビューア。
男木島・女木島・直島ほかの聖地を地図とフィルタで探せます。

データは `data/*.csv` として人手編集可能な形で管理し、[Astro](https://astro.build/) が
ビルド時に読み込んで静的サイトを生成します（GitHub Pages でホスト）。

## ローカルで確認する

```bash
pnpm install
pnpm dev       # http://localhost:4321/samapoke_map/ で確認
```

本番相当のビルドを確認する場合:

```bash
pnpm build     # dist/ に静的サイトを生成
pnpm preview   # dist/ をローカルサーバーで配信
```

## データを更新するには

`data/` 配下の CSV を編集するだけで、次回ビルド時に反映されます（アプリのコードは
変更不要）。

| ファイル | 内容 |
|---|---|
| `data/spots.csv` | 聖地スポット本体（1行 = 1スポット） |
| `data/areas.csv` | エリア enum（表示色・並び順） |
| `data/categories.csv` | カテゴリ enum（アイコン） |
| `data/precision.csv` | 座標精度 enum（ラベル・CSSクラス） |
| `data/badges.csv` | 条件バッジ（★主要・🆕アニメ新規・閉店・要確認 等）の表示ルール |
| `data/routes.csv` / `data/route_stops.csv` | 推奨巡礼ルート（日程・立ち寄りスポット） |
| `data/meta.csv` | サイトタイトル・サブタイトルなど |

### 新しいエリア・カテゴリ・バッジを追加する

`areas.csv` / `categories.csv` / `precision.csv` / `badges.csv` に **行を追加するだけ**
で反映されます。`public/assets/js/app.js` 側の改修は不要です
（`window.SP_DATA.enums` を経由してフロントが動的に読み込みます）。

`badges.csv` の列:

- `field`, `value`: 判定対象（例 `priority`=`true`, `status`=`caution`）
- `contexts`: 表示箇所（`popup` / `list` / `detail` を `|` 区切りで複数指定可）
- `prefix`, `label`: 表示テキスト（絵文字プレフィックス + 本文）
- `class`: 適用する CSS クラス（`assets/css/styles.css` の `.tag--*`）
- `useNote`, `noteMode`: `statusNote` を使うか（`replace`=注記があれば置換 / `append`=末尾に追記）

### `spots.csv` の主な列

`id, name, gameName, area, category, lat, lng, precision, priority, anime, status,
statusNote, address, access, description, warnings, reliability, gmapsUrl`

- `lat`/`lng`/`precision`/`anime`/`status`/`gmapsUrl`: 空セルは「未設定」
- `warnings`: `|`（パイプ）区切りで複数指定
- `priority`: `true` または空

## GitHub Pages で公開する

`.github/workflows/deploy.yml` が `main` への push をトリガーに CSV からビルドし、
GitHub Pages（Actions 方式）へ自動デプロイします。

初回のみ、リポジトリの **Settings → Pages → Source** を **GitHub Actions** に設定してください。

## ファイル構成

```
├── data/                     # 人手編集用データ（唯一の一次データ）
│   └── *.csv
├── src/
│   ├── lib/data.js           # CSV → SP_DATA/enums 変換（ビルド時）
│   └── pages/index.astro     # メインページ（データ注入）
├── public/
│   ├── assets/css/styles.css # スタイル（夏・海・空テーマ）
│   ├── assets/js/app.js      # 地図・一覧・フィルタ・詳細パネル
│   └── vendor/                # Leaflet / MapLibre GL（同梱・CDN不使用）
├── astro.config.mjs
└── .github/workflows/deploy.yml
```

## セキュリティ

- API キー・個人情報・認証情報を一切含みません
- 実行時の外部スクリプト依存なし（地図タイルは OpenFreeMap / OpenStreetMap のみ）
- パブリックリポジトリでそのまま公開可能です

## 利用上の注意

巡礼は地元の方への敬意を最優先に。
私有地立入禁止、夜間の騒音禁止、ゴミ持ち帰り、閉店施設は外観のみ。
干潮条件・立入禁止のスポットは必ず事前確認を。

地図: © OpenFreeMap © OpenMapTiles, Data from © OpenStreetMap contributors
