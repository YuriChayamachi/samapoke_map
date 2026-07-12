// 保存前のサーバー側検証。必須列の欠落と、他テーブルを参照する列
// （area/category/precision/route_id/stop_id 等）の参照整合性をチェックする。
import { TABLES } from './schema.mjs';
import { readTable } from './csv-io.mjs';

// ref 先テーブルの許容値集合をロードする（保存対象のテーブル自身が
// ref 先の場合は、これから保存しようとしている行を優先して使う）
function loadRefValues(refTable, refColumn, pendingTable, pendingRows) {
  const rows = pendingTable === refTable ? pendingRows : readTable(refTable).rows;
  return new Set(rows.map((r) => r[refColumn]).filter((v) => v !== undefined && v !== ''));
}

export function validateTable(table, rows) {
  const def = TABLES[table];
  if (!def) {
    return { ok: false, errors: [`unknown table: ${table}`] };
  }

  const errors = [];
  const refCache = new Map();

  rows.forEach((row, i) => {
    const rowNum = i + 1;
    for (const col of def.columns) {
      if (!(col in row)) {
        errors.push(`row ${rowNum}: missing column "${col}"`);
        continue;
      }
      const field = def.fields[col];
      if (!field) continue;
      const value = row[col] ?? '';

      if (field.required && value === '' && !field.allowEmpty) {
        errors.push(`row ${rowNum}: "${col}" is required`);
      }

      if (field.ref && value !== '') {
        const cacheKey = `${field.ref.table}.${field.ref.column}`;
        if (!refCache.has(cacheKey)) {
          refCache.set(cacheKey, loadRefValues(field.ref.table, field.ref.column, table, rows));
        }
        const allowed = refCache.get(cacheKey);
        if (!allowed.has(value)) {
          errors.push(`row ${rowNum}: "${col}" references unknown ${field.ref.table}.${field.ref.column} "${value}"`);
        }
      }

      if (field.widget === 'pipeTags' && field.ref) {
        const cacheKey = `${field.ref.table}.${field.ref.column}`;
        if (!refCache.has(cacheKey)) {
          refCache.set(cacheKey, loadRefValues(field.ref.table, field.ref.column, table, rows));
        }
        const allowed = refCache.get(cacheKey);
        for (const tag of value.split('|').filter(Boolean)) {
          if (!allowed.has(tag)) {
            errors.push(`row ${rowNum}: "${col}" contains unknown value "${tag}"`);
          }
        }
      }
    }
  });

  // primaryKey の重複チェック
  if (def.primaryKey) {
    const seen = new Set();
    rows.forEach((row, i) => {
      const key = row[def.primaryKey];
      if (key === '' || key === undefined) return;
      if (seen.has(key)) {
        errors.push(`row ${i + 1}: duplicate "${def.primaryKey}" "${key}"`);
      }
      seen.add(key);
    });
  }

  return { ok: errors.length === 0, errors };
}
