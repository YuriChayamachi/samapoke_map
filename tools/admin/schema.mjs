// data/*.csv のスキーマ定義（列・ウィジェット種別・参照関係）。
// サーバー側の検証とフロントエンドのグリッド描画の両方から参照される
// 単一の真実の源。列名・順序は src/lib/data.js の読み込みロジックと一致させること。
//
// widget の種類:
//   text, textarea, number, bool('true'/''), color,
//   select        — options か refTable(+refColumn) から候補を出す。空値許容は allowEmpty
//   pipeTags      — '|' 区切りの複数値（タグ入力）。options か refTable から候補
//
// ref: { table, column } — このテーブルの行が他テーブルの列を参照する制約。
//      保存時に「参照先に値が存在するか」をサーバー側で検証する。

export const TABLES = {
  spots: {
    file: 'spots.csv',
    label: 'スポット',
    primaryKey: 'id',
    columns: [
      'id', 'name', 'gameName', 'area', 'category', 'lat', 'lng', 'precision',
      'priority', 'anime', 'status', 'statusNote', 'address', 'access',
      'description', 'warnings', 'reliability', 'gmapsUrl',
      'official', 'officialUrl', 'refImage',
    ],
    fields: {
      id: { widget: 'text', required: true },
      name: { widget: 'text', required: true },
      gameName: { widget: 'text' },
      area: { widget: 'select', ref: { table: 'areas', column: 'area' }, required: true },
      category: { widget: 'select', ref: { table: 'categories', column: 'category' }, required: true },
      lat: { widget: 'number', map: true },
      lng: { widget: 'number', map: true },
      precision: { widget: 'select', ref: { table: 'precision', column: 'key' }, allowEmpty: true },
      priority: { widget: 'bool' },
      anime: { widget: 'select', options: ['confirmed', 'new'], allowEmpty: true },
      status: { widget: 'select', options: ['open', 'caution', 'closed'], allowEmpty: true },
      statusNote: { widget: 'text' },
      address: { widget: 'text' },
      access: { widget: 'textarea' },
      description: { widget: 'textarea' },
      warnings: { widget: 'pipeTags' },
      reliability: { widget: 'number', min: 1, max: 5 },
      gmapsUrl: { widget: 'text' },
      official: { widget: 'bool' },
      officialUrl: { widget: 'text' },
      refImage: { widget: 'text' },
    },
  },

  areas: {
    file: 'areas.csv',
    label: 'エリア',
    primaryKey: 'area',
    columns: ['area', 'color', 'order'],
    fields: {
      area: { widget: 'text', required: true },
      color: { widget: 'color', required: true },
      order: { widget: 'number', required: true },
    },
  },

  categories: {
    file: 'categories.csv',
    label: 'カテゴリ',
    primaryKey: 'category',
    columns: ['category', 'icon'],
    fields: {
      category: { widget: 'text', required: true },
      icon: { widget: 'text', required: true },
    },
  },

  precision: {
    file: 'precision.csv',
    label: '座標精度',
    primaryKey: 'key',
    columns: ['key', 'label', 'class'],
    fields: {
      key: { widget: 'text', required: true },
      label: { widget: 'text', required: true },
      class: { widget: 'text' },
    },
  },

  badges: {
    file: 'badges.csv',
    label: 'バッジ',
    columns: ['field', 'value', 'contexts', 'prefix', 'label', 'class', 'useNote', 'noteMode'],
    fields: {
      field: { widget: 'select', options: ['priority', 'anime', 'status', 'precision', 'official'], required: true },
      value: { widget: 'text', required: true },
      contexts: { widget: 'pipeTags', options: ['popup', 'list', 'detail'], required: true },
      prefix: { widget: 'text' },
      label: { widget: 'text', required: true },
      class: { widget: 'text' },
      useNote: { widget: 'bool' },
      noteMode: { widget: 'select', options: ['none', 'replace', 'append'], allowEmpty: true },
    },
  },

  routes: {
    file: 'routes.csv',
    label: 'ルート',
    primaryKey: 'route_id',
    columns: ['route_id', 'name', 'note'],
    fields: {
      route_id: { widget: 'text', required: true },
      name: { widget: 'text', required: true },
      note: { widget: 'textarea' },
    },
  },

  route_stops: {
    file: 'route_stops.csv',
    label: 'ルート行程',
    columns: ['route_id', 'day_label', 'day_title', 'day_note', 'stop_id', 'order'],
    fields: {
      route_id: { widget: 'select', ref: { table: 'routes', column: 'route_id' }, required: true },
      day_label: { widget: 'text', required: true },
      day_title: { widget: 'text' },
      day_note: { widget: 'textarea' },
      stop_id: { widget: 'select', ref: { table: 'spots', column: 'id' }, required: true },
      order: { widget: 'number', required: true },
    },
  },

  meta: {
    file: 'meta.csv',
    label: 'サイト情報',
    primaryKey: 'key',
    columns: ['key', 'value'],
    fields: {
      key: { widget: 'text', required: true },
      value: { widget: 'textarea', required: true },
    },
  },
};

export const TABLE_ORDER = ['spots', 'areas', 'categories', 'precision', 'badges', 'routes', 'route_stops', 'meta'];
