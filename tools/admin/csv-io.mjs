// data/*.csv の読み書き専用ユーティリティ（ローカル管理 UI 用）。
// src/lib/data.js と同じパース設定を使い、型変換はせず「生の文字列の行」を
// そのまま扱う。書き込みは csv-parse と往復整合する quoting で行う。
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { TABLES } from './schema.mjs';

const DATA_DIR = fileURLToPath(new URL('../../data/', import.meta.url));

// パストラバーサル防止: schema.mjs に定義されたテーブルのファイル名のみ許可
function resolveFile(table) {
  const def = TABLES[table];
  if (!def) {
    throw new Error(`unknown table: ${table}`);
  }
  return { def, path: DATA_DIR + def.file };
}

export function readTable(table) {
  const { def, path } = resolveFile(table);
  const content = readFileSync(path, 'utf8');
  const rows = parse(content, { columns: true, skip_empty_lines: true, trim: false });
  return { columns: def.columns, rows };
}

export function writeTable(table, rows) {
  const { def, path } = resolveFile(table);
  const out = stringify(rows, {
    header: true,
    columns: def.columns,
    record_delimiter: '\n',
  });
  writeFileSync(path, out, 'utf8');
}

export function readAllTables() {
  const result = {};
  for (const table of Object.keys(TABLES)) {
    result[table] = readTable(table);
  }
  return result;
}
