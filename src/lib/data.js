// ビルド時（Node/Astro フロントマター）専用の CSV ローダ。
// data/*.csv を読み込み、旧 window.SP_DATA と互換の形へ変換する。
// enum 的要素（area/category/precision/badges）も CSV から生成するため、
// 新しいエリア・カテゴリ・バッジを追加する際は CSV を編集するだけでよい。
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse/sync';

const DATA_DIR = fileURLToPath(new URL('../../data/', import.meta.url));

function readCsv(filename) {
  const content = readFileSync(DATA_DIR + filename, 'utf8');
  return parse(content, { columns: true, skip_empty_lines: true, trim: false });
}

// 空文字列を null 化（CSV では空セル = 未設定を表す）
function nullIfEmpty(v) {
  return v === '' || v === undefined ? null : v;
}

function toNumber(v) {
  const n = nullIfEmpty(v);
  return n === null ? null : Number(n);
}

function toBool(v) {
  return v === 'true';
}

function loadSpots() {
  const rows = readCsv('spots.csv');
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    gameName: r.gameName,
    area: r.area,
    category: r.category,
    lat: toNumber(r.lat),
    lng: toNumber(r.lng),
    precision: nullIfEmpty(r.precision),
    priority: toBool(r.priority),
    anime: nullIfEmpty(r.anime),
    status: nullIfEmpty(r.status),
    statusNote: r.statusNote || '',
    address: r.address || '',
    access: r.access || '',
    description: r.description || '',
    warnings: r.warnings ? r.warnings.split('|') : [],
    reliability: toNumber(r.reliability),
    gmapsUrl: nullIfEmpty(r.gmapsUrl),
  }));
}

function loadAreas() {
  const rows = readCsv('areas.csv');
  return rows
    .map((r) => ({ area: r.area, color: r.color, order: toNumber(r.order) }))
    .sort((a, b) => a.order - b.order);
}

function loadCategories() {
  const rows = readCsv('categories.csv');
  return rows.map((r) => ({ category: r.category, icon: r.icon }));
}

function loadPrecision() {
  const rows = readCsv('precision.csv');
  return rows.map((r) => ({ key: r.key, label: r.label, class: r.class || '' }));
}

function loadBadges() {
  const rows = readCsv('badges.csv');
  return rows.map((r) => ({
    field: r.field,
    value: r.value,
    contexts: r.contexts.split('|'),
    prefix: r.prefix || '',
    label: r.label,
    class: r.class || '',
    useNote: toBool(r.useNote),
    // noteMode: 'replace' = 統計注記があれば label の代わりに使う
    //           'append'  = 統計注記を label の後ろへ " — " 区切りで付加
    noteMode: r.noteMode || 'none',
  }));
}

function loadRoutes() {
  const routeRows = readCsv('routes.csv');
  const stopRows = readCsv('route_stops.csv');

  return routeRows.map((route) => {
    const stopsForRoute = stopRows
      .filter((s) => s.route_id === route.route_id)
      .sort((a, b) => toNumber(a.order) - toNumber(b.order));

    // day_label の出現順を保ったまま stops をグルーピング
    const dayOrder = [];
    const dayMap = new Map();
    stopsForRoute.forEach((s) => {
      if (!dayMap.has(s.day_label)) {
        dayOrder.push(s.day_label);
        dayMap.set(s.day_label, {
          label: s.day_label,
          title: s.day_title,
          note: s.day_note,
          stops: [],
        });
      }
      dayMap.get(s.day_label).stops.push(s.stop_id);
    });

    return {
      id: route.route_id,
      name: route.name,
      note: route.note,
      days: dayOrder.map((label) => dayMap.get(label)),
    };
  });
}

function loadMeta() {
  const rows = readCsv('meta.csv');
  const meta = {};
  rows.forEach((r) => {
    meta[r.key] = r.value;
  });
  return meta;
}

export function loadData() {
  return {
    meta: loadMeta(),
    spots: loadSpots(),
    routes: loadRoutes(),
    enums: {
      areas: loadAreas(),
      categories: loadCategories(),
      precision: loadPrecision(),
      badges: loadBadges(),
    },
  };
}
