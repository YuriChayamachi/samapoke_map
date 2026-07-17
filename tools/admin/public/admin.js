// CSV 管理 UI — フレームワーク無しのバニラ JS。
// /api/data から全テーブルを読み込み、行リスト＋詳細フォーム（spots は地図付き）で編集し、
// /api/save/:table へ POST して data/*.csv へ書き戻す。
'use strict';

/** @type {Record<string, object>} サーバーから受け取ったテーブル定義 */
let SCHEMA = {};
let TABLE_ORDER = [];
/** @type {Record<string, {columns: string[], rows: Record<string,string>[]}>} */
let TABLES = {};

const dirty = new Set();
const selectedIndex = {}; // table -> selected row index
let currentTable = null;

let map = null;
let markers = [];

const $ = (sel) => document.querySelector(sel);

async function init() {
  const res = await fetch('/api/data');
  const data = await res.json();
  SCHEMA = data.schema;
  TABLE_ORDER = data.tableOrder;
  TABLES = data.tables;
  currentTable = TABLE_ORDER[0];
  renderTabs();
  switchTable(currentTable);

  $('#saveAllBtn').addEventListener('click', saveAll);
  $('#addRowBtn').addEventListener('click', () => addRow(currentTable));
  $('#duplicateRowBtn').addEventListener('click', () => duplicateRow(currentTable));
  $('#deleteRowBtn').addEventListener('click', () => deleteRow(currentTable));
  $('#moveUpBtn').addEventListener('click', () => moveRow(currentTable, -1));
  $('#moveDownBtn').addEventListener('click', () => moveRow(currentTable, 1));
  $('#saveTableBtn').addEventListener('click', () => saveTable(currentTable));
  $('#rowFilter').addEventListener('input', () => renderRowList(currentTable));

  window.addEventListener('beforeunload', (e) => {
    if (dirty.size > 0) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
}

// ---------- タブ ----------

function renderTabs() {
  const tabs = $('#tabs');
  tabs.innerHTML = '';
  TABLE_ORDER.forEach((table) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tab' + (table === currentTable ? ' active' : '') + (dirty.has(table) ? ' dirty' : '');
    btn.textContent = SCHEMA[table].label || table;
    btn.addEventListener('click', () => switchTable(table));
    tabs.appendChild(btn);
  });
}

function switchTable(table) {
  currentTable = table;
  if (selectedIndex[table] === undefined) {
    selectedIndex[table] = TABLES[table].rows.length ? 0 : -1;
  }
  renderTabs();
  const isSpots = table === 'spots';
  $('#mapPanel').hidden = !isSpots;
  if (isSpots) {
    ensureMap();
    refreshMapMarkers();
  }
  renderRowList(table);
  renderForm(table);
}

// ---------- 行リスト ----------

function labelForRow(table, row) {
  const def = SCHEMA[table];
  if (def.primaryKey) return row[def.primaryKey] || '(未入力)';
  const cols = def.columns.slice(0, 2);
  return cols.map((c) => row[c]).filter(Boolean).join(' / ') || '(未入力)';
}

function rowIsIncomplete(table, row) {
  const def = SCHEMA[table];
  return def.columns.some((c) => {
    const f = def.fields[c];
    return f?.required && !f.allowEmpty && !row[c];
  });
}

function renderRowList(table) {
  const def = SCHEMA[table];
  const list = $('#rowList');
  list.innerHTML = '';
  const filter = $('#rowFilter').value.trim().toLowerCase();
  const rows = TABLES[table].rows;

  rows.forEach((row, idx) => {
    const label = labelForRow(table, row);
    if (filter && !label.toLowerCase().includes(filter) && !JSON.stringify(row).toLowerCase().includes(filter)) {
      return;
    }
    const li = document.createElement('li');
    li.textContent = label;
    if (idx === selectedIndex[table]) li.classList.add('selected');
    if (rowIsIncomplete(table, row)) li.classList.add('incomplete');
    li.addEventListener('click', () => selectRow(table, idx));
    list.appendChild(li);
  });

  if (!rows.length) {
    const li = document.createElement('li');
    li.textContent = '行がありません。「＋ 追加」で作成してください。';
    li.style.cursor = 'default';
    list.appendChild(li);
  }
}

function selectRow(table, idx) {
  selectedIndex[table] = idx;
  renderRowList(table);
  renderForm(table);
  if (table === 'spots') focusMapOnSelected();
}

// ---------- 行の追加・複製・削除・並べ替え ----------

function emptyRow(table) {
  const def = SCHEMA[table];
  const row = {};
  def.columns.forEach((c) => { row[c] = ''; });
  return row;
}

function addRow(table) {
  TABLES[table].rows.push(emptyRow(table));
  selectedIndex[table] = TABLES[table].rows.length - 1;
  markDirty(table);
  renderRowList(table);
  renderForm(table);
  if (table === 'spots') refreshMapMarkers();
}

function duplicateRow(table) {
  const idx = selectedIndex[table];
  if (idx < 0) return;
  const copy = { ...TABLES[table].rows[idx] };
  const def = SCHEMA[table];
  if (def.primaryKey && copy[def.primaryKey]) copy[def.primaryKey] = copy[def.primaryKey] + '-copy';
  TABLES[table].rows.splice(idx + 1, 0, copy);
  selectedIndex[table] = idx + 1;
  markDirty(table);
  renderRowList(table);
  renderForm(table);
  if (table === 'spots') refreshMapMarkers();
}

function deleteRow(table) {
  const idx = selectedIndex[table];
  if (idx < 0) return;
  const row = TABLES[table].rows[idx];
  if (!confirm(`「${labelForRow(table, row)}」を削除しますか？`)) return;
  TABLES[table].rows.splice(idx, 1);
  selectedIndex[table] = Math.min(idx, TABLES[table].rows.length - 1);
  markDirty(table);
  renderRowList(table);
  renderForm(table);
  if (table === 'spots') refreshMapMarkers();
}

function moveRow(table, dir) {
  const idx = selectedIndex[table];
  const rows = TABLES[table].rows;
  const target = idx + dir;
  if (idx < 0 || target < 0 || target >= rows.length) return;
  [rows[idx], rows[target]] = [rows[target], rows[idx]];
  selectedIndex[table] = target;
  markDirty(table);
  renderRowList(table);
  renderForm(table);
}

// ---------- 詳細フォーム ----------

function fieldOptions(field) {
  if (field.options) return field.options;
  if (field.ref) {
    const refRows = TABLES[field.ref.table]?.rows || [];
    const values = refRows.map((r) => r[field.ref.column]).filter(Boolean);
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, 'ja'));
  }
  return [];
}

function onFieldChanged(table, idx, col) {
  markDirty(table);
  renderRowList(table); // ラベルに関わる列かもしれないので更新
  if (table === 'spots') refreshMapMarkers();
}

function renderField(table, idx, col) {
  const def = SCHEMA[table];
  const field = def.fields[col] || { widget: 'text' };
  const row = TABLES[table].rows[idx];

  const wrap = document.createElement('div');
  wrap.className = 'field-row';
  const label = document.createElement('label');
  label.textContent = col + (field.required && !field.allowEmpty ? ' *' : '');
  wrap.appendChild(label);

  if (field.widget === 'textarea') {
    const el = document.createElement('textarea');
    el.value = row[col] || '';
    el.addEventListener('input', () => { row[col] = el.value; onFieldChanged(table, idx, col); });
    wrap.appendChild(el);
  } else if (field.widget === 'bool') {
    const boolRow = document.createElement('div');
    boolRow.className = 'bool-row';
    const el = document.createElement('input');
    el.type = 'checkbox';
    el.checked = row[col] === 'true';
    el.addEventListener('change', () => { row[col] = el.checked ? 'true' : ''; onFieldChanged(table, idx, col); });
    boolRow.appendChild(el);
    boolRow.appendChild(document.createTextNode(row[col] === 'true' ? 'true' : '(空)'));
    wrap.appendChild(boolRow);
  } else if (field.widget === 'color') {
    const colorRow = document.createElement('div');
    colorRow.className = 'color-row';
    const el = document.createElement('input');
    el.type = 'color';
    el.value = /^#[0-9a-fA-F]{6}$/.test(row[col]) ? row[col] : '#888888';
    const text = document.createElement('input');
    text.type = 'text';
    text.value = row[col] || '';
    el.addEventListener('input', () => { text.value = el.value; row[col] = el.value; onFieldChanged(table, idx, col); });
    text.addEventListener('input', () => {
      row[col] = text.value;
      if (/^#[0-9a-fA-F]{6}$/.test(text.value)) el.value = text.value;
      onFieldChanged(table, idx, col);
    });
    colorRow.appendChild(el);
    colorRow.appendChild(text);
    wrap.appendChild(colorRow);
  } else if (field.widget === 'select') {
    const el = document.createElement('select');
    const opts = fieldOptions(field);
    if (field.allowEmpty || !field.required || !opts.includes(row[col])) {
      const optEl = document.createElement('option');
      optEl.value = '';
      optEl.textContent = '-- 未選択 --';
      el.appendChild(optEl);
    }
    opts.forEach((opt) => {
      const optEl = document.createElement('option');
      optEl.value = opt;
      optEl.textContent = opt;
      if (opt === row[col]) optEl.selected = true;
      el.appendChild(optEl);
    });
    el.addEventListener('change', () => { row[col] = el.value; onFieldChanged(table, idx, col); });
    wrap.appendChild(el);
  } else if (field.widget === 'pipeTags') {
    wrap.appendChild(renderPipeTags(row, col, fieldOptions(field), () => onFieldChanged(table, idx, col)));
  } else if (field.widget === 'number') {
    const el = document.createElement('input');
    el.type = 'number';
    if (field.min !== undefined) el.min = field.min;
    if (field.max !== undefined) el.max = field.max;
    el.step = 'any';
    el.value = row[col] || '';
    el.addEventListener('input', () => { row[col] = el.value; onFieldChanged(table, idx, col); });
    wrap.appendChild(el);
  } else {
    const el = document.createElement('input');
    el.type = 'text';
    el.value = row[col] || '';
    el.addEventListener('input', () => { row[col] = el.value; onFieldChanged(table, idx, col); });
    wrap.appendChild(el);
  }

  return wrap;
}

function renderPipeTags(row, col, options, onChange) {
  const container = document.createElement('div');
  container.className = 'tags-editor';

  function refresh() {
    container.innerHTML = '';
    const tags = (row[col] || '').split('|').filter(Boolean);
    tags.forEach((tag) => {
      const chip = document.createElement('span');
      chip.className = 'tag-chip';
      chip.appendChild(document.createTextNode(tag));
      const rm = document.createElement('button');
      rm.type = 'button';
      rm.textContent = '×';
      rm.addEventListener('click', () => {
        row[col] = tags.filter((t) => t !== tag).join('|');
        onChange();
        refresh();
      });
      chip.appendChild(rm);
      container.appendChild(chip);
    });

    if (options.length) {
      const select = document.createElement('select');
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = '+ 追加';
      select.appendChild(placeholder);
      options.filter((o) => !tags.includes(o)).forEach((o) => {
        const optEl = document.createElement('option');
        optEl.value = o;
        optEl.textContent = o;
        select.appendChild(optEl);
      });
      select.addEventListener('change', () => {
        if (!select.value) return;
        row[col] = [...tags, select.value].join('|');
        onChange();
        refresh();
      });
      container.appendChild(select);
    } else {
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = '追加してEnter';
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && input.value.trim()) {
          e.preventDefault();
          row[col] = [...tags, input.value.trim()].join('|');
          onChange();
          refresh();
        }
      });
      container.appendChild(input);
    }
  }

  refresh();
  return container;
}

function renderForm(table) {
  const form = $('#detailForm');
  form.innerHTML = '';
  const idx = selectedIndex[table];
  if (idx === undefined || idx < 0 || !TABLES[table].rows[idx]) {
    const hint = document.createElement('p');
    hint.className = 'empty-hint';
    hint.textContent = '編集する行を左のリストから選択するか、「＋ 追加」してください。';
    form.appendChild(hint);
    return;
  }
  const def = SCHEMA[table];
  def.columns.forEach((col) => {
    form.appendChild(renderField(table, idx, col));
  });
}

// ---------- 地図（spots 専用） ----------
// メインサイト（src/components/Map/MapView.tsx）と同じ MapLibre GL JS + OpenFreeMap
// スタイルを使用する。座標順は Leaflet の [lat, lng] ではなく [lng, lat]。

function ensureMap() {
  if (map) return;
  map = new maplibregl.Map({
    container: 'spotMap',
    style: 'https://tiles.openfreemap.org/styles/liberty',
    center: [134.03, 34.41], // 高松〜男木・女木島付近を初期表示
    zoom: 11,
    localIdeographFontFamily: "'Hiragino Sans','Noto Sans CJK JP','Yu Gothic',sans-serif",
  });

  map.on('click', (e) => {
    const idx = selectedIndex.spots;
    if (idx === undefined || idx < 0) return;
    const row = TABLES.spots.rows[idx];
    row.lat = e.lngLat.lat.toFixed(5);
    row.lng = e.lngLat.lng.toFixed(5);
    markDirty('spots');
    renderForm('spots');
    refreshMapMarkers();
  });
}

function refreshMapMarkers() {
  if (!map) return;
  markers.forEach((m) => m.remove());
  markers = [];
  const selIdx = selectedIndex.spots;

  TABLES.spots.rows.forEach((row, idx) => {
    const lat = Number(row.lat);
    const lng = Number(row.lng);
    if (!row.lat || !row.lng || Number.isNaN(lat) || Number.isNaN(lng)) return;
    const isSelected = idx === selIdx;

    const el = document.createElement('div');
    const diameter = isSelected ? 18 : 12;
    el.title = row.name || row.id || '(無題)';
    el.style.width = `${diameter}px`;
    el.style.height = `${diameter}px`;
    el.style.borderRadius = '50%';
    el.style.boxSizing = 'border-box';
    el.style.cursor = 'pointer';
    el.style.background = isSelected ? '#e8703a' : '#2f7fb5';
    el.style.border = `${isSelected ? 3 : 1}px solid ${isSelected ? '#e8703a' : '#2f7fb5'}`;
    el.style.opacity = '0.8';
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      selectRow('spots', idx);
    });

    const marker = new maplibregl.Marker({ element: el, draggable: isSelected })
      .setLngLat([lng, lat])
      .addTo(map);

    if (isSelected) {
      marker.on('dragend', () => {
        const pos = marker.getLngLat();
        row.lat = pos.lat.toFixed(5);
        row.lng = pos.lng.toFixed(5);
        markDirty('spots');
        renderForm('spots');
        refreshMapMarkers();
      });
    }

    markers.push(marker);
  });
}

function focusMapOnSelected() {
  if (!map) return;
  const idx = selectedIndex.spots;
  const row = TABLES.spots.rows[idx];
  if (!row) return;
  refreshMapMarkers();
  const lat = Number(row.lat);
  const lng = Number(row.lng);
  if (row.lat && row.lng && !Number.isNaN(lat) && !Number.isNaN(lng)) {
    map.flyTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 13) });
  }
}

// ---------- 保存 ----------

function markDirty(table) {
  dirty.add(table);
  renderTabs();
}

function setStatus(text) {
  $('#status').textContent = text;
}

function showErrors(errors) {
  const box = $('#errorBox');
  if (!errors || !errors.length) {
    box.hidden = true;
    box.textContent = '';
    return;
  }
  box.hidden = false;
  box.textContent = errors.join('\n');
}

async function saveTable(table) {
  showErrors(null);
  setStatus(`${SCHEMA[table].label} を保存中...`);
  try {
    const res = await fetch(`/api/save/${table}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: TABLES[table].rows }),
    });
    const result = await res.json();
    if (!res.ok || !result.ok) {
      showErrors(result.errors || ['保存に失敗しました']);
      setStatus(`${SCHEMA[table].label} の保存に失敗`);
      return false;
    }
    dirty.delete(table);
    renderTabs();
    setStatus(`${SCHEMA[table].label} を保存しました`);
    return true;
  } catch (err) {
    showErrors([String(err)]);
    setStatus('保存に失敗しました');
    return false;
  }
}

async function saveAll() {
  const targets = Array.from(dirty);
  if (!targets.length) {
    setStatus('変更はありません');
    return;
  }
  for (const table of targets) {
    const ok = await saveTable(table);
    if (!ok) {
      setStatus(`「${SCHEMA[table].label}」で保存が停止しました。エラーを確認してください。`);
      return;
    }
  }
  setStatus('すべての変更を保存しました');
}

init();
