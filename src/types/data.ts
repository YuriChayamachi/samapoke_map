// data/*.csv をビルド時に読み込んだ結果の型。src/lib/data.ts の loadData() の
// 戻り値の形とここでの定義は一致させること（新しいフィールドを CSV に追加した場合は
// 両方を更新する）。

export type BadgeContext = 'popup' | 'list' | 'detail';
export type NoteMode = 'replace' | 'append' | 'none';

export interface Scene {
  order: number;
  name: string;
  description: string;
  images: string[];
}

export interface Spot {
  id: string;
  name: string;
  gameName: string;
  area: string;
  category: string;
  lat: number | null;
  lng: number | null;
  precision: string | null;
  priority: boolean;
  anime: string | null;
  status: string | null;
  statusNote: string;
  address: string;
  access: string;
  description: string;
  warnings: string[];
  reliability: number | null;
  gmapsUrl: string | null;
  official: boolean;
  officialUrl: string | null;
  refImage: string | null;
  srcAnime: boolean;
  srcGame: boolean;
  guide: boolean;
  episodes: string[];
  scenes: Scene[];
}

export interface RouteStop {
  id: string;
  travel: string;
}

export interface RouteDay {
  label: string;
  title: string;
  note: string;
  stops: RouteStop[];
}

export interface PilgrimageRoute {
  id: string;
  name: string;
  note: string;
  days: RouteDay[];
}

export interface Area {
  area: string;
  color: string;
  order: number;
}

export interface Category {
  category: string;
  icon: string;
}

export interface Precision {
  key: string;
  label: string;
  class: string;
}

export interface Badge {
  field: keyof Spot;
  value: string;
  contexts: BadgeContext[];
  prefix: string;
  label: string;
  class: string;
  useNote: boolean;
  noteMode: NoteMode;
}

export interface Enums {
  areas: Area[];
  categories: Category[];
  precision: Precision[];
  badges: Badge[];
}

export type Meta = Record<string, string>;

export interface AppData {
  meta: Meta;
  spots: Spot[];
  routes: PilgrimageRoute[];
  enums: Enums;
}
