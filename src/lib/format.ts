// enum（CSV駆動）ルックアップ用の純関数。
// 新しいエリア/カテゴリ/座標精度を増やす場合は CSV に行を追加するだけでよく、
// このファイルを変更する必要はない。
import type { Enums, Precision, Spot } from '../types/data';

export interface EnumMaps {
  areaColor: Record<string, string>;
  catIcon: Record<string, string>;
  precision: Record<string, Precision>;
}

export function buildAreaColorMap(enums: Enums): Record<string, string> {
  const map: Record<string, string> = {};
  enums.areas.forEach((a) => {
    map[a.area] = a.color;
  });
  return map;
}

export function buildCategoryIconMap(enums: Enums): Record<string, string> {
  const map: Record<string, string> = {};
  enums.categories.forEach((c) => {
    map[c.category] = c.icon;
  });
  return map;
}

export function buildPrecisionMap(enums: Enums): Record<string, Precision> {
  const map: Record<string, Precision> = {};
  enums.precision.forEach((p) => {
    map[p.key] = p;
  });
  return map;
}

export function buildEnumMaps(enums: Enums): EnumMaps {
  return {
    areaColor: buildAreaColorMap(enums),
    catIcon: buildCategoryIconMap(enums),
    precision: buildPrecisionMap(enums),
  };
}

export function areaColor(map: Record<string, string>, area: string): string {
  return map[area] || '#6b7785';
}

export function catIcon(map: Record<string, string>, category: string): string {
  return map[category] || '📌';
}

export function gmapsLink(s: Spot): string | null {
  if (s.gmapsUrl) return s.gmapsUrl;
  if (s.lat != null && s.lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`;
  }
  return null;
}

// "1" -> "1話" / "OP","ED" はそのまま
export function formatEpisodeToken(tok: string): string {
  return /^\d+$/.test(tok) ? tok + '話' : tok;
}
