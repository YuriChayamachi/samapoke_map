# Summer Pockets 聖地巡礼マップ — Web アプリ

## ローカルで確認する

### 方法 A: ブラウザで直接開く

`docs/index.html` をブラウザにドラッグ＆ドロップするか、ダブルクリックするだけで動作します。  
（データは JS 変数で保持するため CORS エラーは発生しません）

### 方法 B: ローカルサーバーで確認する（推奨）

```bash
cd docs
python3 -m http.server 8000
# → http://localhost:8000 をブラウザで開く
```

Node.js がある場合:
```bash
npx serve docs
```

## GitHub Pages で公開する

1. このフォルダを含むリポジトリを GitHub に push する
2. リポジトリの **Settings → Pages**
3. **Source**: "Deploy from a branch"
4. **Branch**: `main` / **Folder**: `/docs`
5. **Save** → 数分後に `https://<user>.github.io/<repo>/` で公開

> ビルド・GitHub Actions・シークレット設定は一切不要です。  
> 相対パスで構成されているため、リポジトリ名に関係なく動作します。

## ファイル構成

```
docs/
├── index.html                  # メインページ
├── assets/
│   ├── css/styles.css          # スタイル（夏・海・空テーマ）
│   └── js/
│       ├── data.js             # 聖地データ（window.SP_DATA）
│       └── app.js              # 地図・一覧・フィルタ・詳細パネル
└── vendor/leaflet/             # Leaflet（同梱・CDN 不使用）
    ├── leaflet.js
    ├── leaflet.css
    └── images/
```

## データを更新するには

`assets/js/data.js` の `window.SP_DATA.spots` 配列を直接編集します。  
一次ソース（上位ディレクトリの CSV / Markdown ファイル）と合わせて更新してください。

## セキュリティ

- API キー・個人情報・認証情報を一切含みません
- 実行時の外部スクリプト依存なし（地図タイルは OpenStreetMap のみ）
- パブリックリポジトリでそのまま公開可能です

## 利用上の注意

巡礼は地元の方への敬意を最優先に。  
私有地立入禁止、夜間の騒音禁止、ゴミ持ち帰り、閉店施設は外観のみ。  
干潮条件・立入禁止のスポットは必ず事前確認を。

地図: © OpenStreetMap contributors  
データ: 本リポジトリ内リサーチ資料（2026-06-14 版）
