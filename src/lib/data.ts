// ビルド時（Node/Astro フロントマター）専用の CSV ローダ。
// data/*.csv を読み込み、AppData 形へ変換する。
// enum 的要素（area/category/precision/badges）も CSV から生成するため、
// 新しいエリア・カテゴリ・バッジを追加する際は CSV を編集するだけでよい。
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse/sync';
import type {
  Area,
  Badge,
  BadgeContext,
  Category,
  Meta,
  NoteMode,
  Precision,
  PilgrimageRoute,
  RouteDay,
  Scene,
  Spot,
  AppData,
} from '../types/data';

const DATA_DIR = fileURLToPath(new URL('../../data/', import.meta.url));

function readCsv(filename: string): Record<string, string>[] {
  const content = readFileSync(DATA_DIR + filename, 'utf8');
  return parse(content, { columns: true, skip_empty_lines: true, trim: false });
}

// 空文字列を null 化（CSV では空セル = 未設定を表す）
function nullIfEmpty(v: string | undefined): string | null {
  return v === '' || v === undefined ? null : v;
}

function toNumber(v: string | undefined): number | null {
  const n = nullIfEmpty(v);
  return n === null ? null : Number(n);
}

function toBool(v: string | undefined): boolean {
  return v === 'true';
}

// mymaps.usercontent.google.com の画像は Cross-Origin-Resource-Policy: same-site を返し、
// ブラウザが cross-origin の <img> 描画を拒否する（取得は 200 でも表示されない）。
// wsrv.nl 画像プロキシ経由に書き換え、埋め込み可能なヘッダ(CORP: cross-origin / ACAO: *)で
// 再配信させる。あわせて縮小して軽量化する（元画像は 1 枚 ~2MB）。
function proxyImage(url: string): string {
  if (!url.includes('mymaps.usercontent.google.com')) return url;
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=1024&output=webp&q=80`;
}

function loadSpots(): Omit<Spot, 'scenes'>[] {
  const rows = readCsv('spots.csv');
  return rows.map((r) => {
    const refImage = nullIfEmpty(r.refImage);
    return {
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
      official: toBool(r.official),
      officialUrl: nullIfEmpty(r.officialUrl),
      refImage: refImage ? proxyImage(refImage) : null,
      srcAnime: toBool(r.srcAnime),
      srcGame: toBool(r.srcGame),
      guide: toBool(r.guide),
      episodes: r.episodes ? r.episodes.split('|') : [],
    };
  });
}

// spot_id ごとの複数シーン（scenes.csv）。1スポットに複数シーン（名前・画像複数・説明）を
// 持たせるための拡張データで、loadData() で対応する spot に scenes として付与する。
function loadScenes(): Map<string, Scene[]> {
  const rows = readCsv('scenes.csv');
  const bySpot = new Map<string, Scene[]>();
  rows.forEach((r) => {
    const list = bySpot.get(r.spot_id) || [];
    list.push({
      order: toNumber(r.order) ?? 0,
      name: r.name,
      description: r.description || '',
      images: r.images ? r.images.split('|').map(proxyImage) : [],
    });
    bySpot.set(r.spot_id, list);
  });
  bySpot.forEach((list) => list.sort((a, b) => a.order - b.order));
  return bySpot;
}

function loadAreas(): Area[] {
  const rows = readCsv('areas.csv');
  return rows
    .map((r) => ({ area: r.area, color: r.color, order: toNumber(r.order) ?? 0 }))
    .sort((a, b) => a.order - b.order);
}

function loadCategories(): Category[] {
  const rows = readCsv('categories.csv');
  return rows.map((r) => ({ category: r.category, icon: r.icon }));
}

function loadPrecision(): Precision[] {
  const rows = readCsv('precision.csv');
  return rows.map((r) => ({ key: r.key, label: r.label, class: r.class || '' }));
}

function loadBadges(): Badge[] {
  const rows = readCsv('badges.csv');
  return rows.map((r) => ({
    field: r.field as Badge['field'],
    value: r.value,
    contexts: r.contexts.split('|') as BadgeContext[],
    prefix: r.prefix || '',
    label: r.label,
    class: r.class || '',
    useNote: toBool(r.useNote),
    // noteMode: 'replace' = 統計注記があれば label の代わりに使う
    //           'append'  = 統計注記を label の後ろへ " — " 区切りで付加
    noteMode: (r.noteMode || 'none') as NoteMode,
  }));
}

function loadRoutes(): PilgrimageRoute[] {
  const routeRows = readCsv('routes.csv');
  const stopRows = readCsv('route_stops.csv');

  return routeRows.map((route) => {
    const stopsForRoute = stopRows
      .filter((s) => s.route_id === route.route_id)
      .sort((a, b) => (toNumber(a.order) ?? 0) - (toNumber(b.order) ?? 0));

    // day_label の出現順を保ったまま stops をグルーピング
    const dayOrder: string[] = [];
    const dayMap = new Map<string, RouteDay>();
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
      // stop は {id, travel} 形式。travel = そのスポットから次のスポットへの移動時間・距離
      // （例 "🚶徒歩1分 🚲自転車1分未満 📍60m"）。route_stops.csv の travel 列に対応。
      dayMap.get(s.day_label)!.stops.push({ id: s.stop_id, travel: s.travel || '' });
    });

    return {
      id: route.route_id,
      name: route.name,
      note: route.note,
      days: dayOrder.map((label) => dayMap.get(label)!),
    };
  });
}

function loadMeta(): Meta {
  const rows = readCsv('meta.csv');
  const meta: Meta = {};
  rows.forEach((r) => {
    meta[r.key] = r.value;
  });
  return meta;
}

export function loadData(): AppData {
  const scenesBySpot = loadScenes();
  const spots: Spot[] = loadSpots().map((s) => ({ ...s, scenes: scenesBySpot.get(s.id) || [] }));

  return {
    meta: loadMeta(),
    spots,
    routes: loadRoutes(),
    enums: {
      areas: loadAreas(),
      categories: loadCategories(),
      precision: loadPrecision(),
      badges: loadBadges(),
    },
  };
}
