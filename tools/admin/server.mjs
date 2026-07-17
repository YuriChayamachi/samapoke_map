// ローカル専用の CSV 管理 UI サーバー。
// 127.0.0.1 のみに bind し、Astro のビルド/デプロイには一切関与しない。
// 起動: pnpm admin  (= node tools/admin/server.mjs)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { extname, join, normalize } from 'node:path';
import { TABLES, TABLE_ORDER } from './schema.mjs';
import { readAllTables, writeTable } from './csv-io.mjs';
import { validateTable } from './validate.mjs';

const PORT = process.env.ADMIN_PORT ? Number(process.env.ADMIN_PORT) : 5174;
const HOST = '127.0.0.1';

const PUBLIC_DIR = fileURLToPath(new URL('./public/', import.meta.url));
const VENDOR_MAPLIBRE_DIR = join(PUBLIC_DIR, 'vendor', 'maplibre-gl');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

// dir 配下に閉じ込めたファイル配信（パストラバーサル防止）
function serveStatic(res, dir, reqPath) {
  const rel = normalize(reqPath).replace(/^(\.\.[/\\])+/, '');
  const filePath = join(dir, rel);
  if (!filePath.startsWith(dir) || !existsSync(filePath) || !statSync(filePath).isFile()) {
    return false;
  }
  const type = MIME[extname(filePath)] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type });
  createReadStream(filePath).pipe(res);
  return true;
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = url;

  try {
    if (req.method === 'GET' && pathname === '/api/data') {
      const tables = readAllTables();
      return send(res, 200, { tableOrder: TABLE_ORDER, schema: TABLES, tables });
    }

    if (req.method === 'POST' && pathname.startsWith('/api/save/')) {
      const table = pathname.slice('/api/save/'.length);
      if (!TABLES[table]) {
        return send(res, 404, { ok: false, errors: [`unknown table: ${table}`] });
      }
      let payload;
      try {
        payload = JSON.parse(await readBody(req));
      } catch {
        return send(res, 400, { ok: false, errors: ['invalid JSON body'] });
      }
      const rows = Array.isArray(payload?.rows) ? payload.rows : null;
      if (!rows) {
        return send(res, 400, { ok: false, errors: ['body must be { rows: [...] }'] });
      }
      const result = validateTable(table, rows);
      if (!result.ok) {
        return send(res, 400, result);
      }
      writeTable(table, rows);
      return send(res, 200, { ok: true });
    }

    if (req.method === 'GET' && pathname.startsWith('/vendor/maplibre-gl/')) {
      const rel = pathname.slice('/vendor/maplibre-gl/'.length);
      if (serveStatic(res, VENDOR_MAPLIBRE_DIR, rel)) return;
      return send(res, 404, { ok: false, errors: ['not found'] });
    }

    if (req.method === 'GET') {
      const rel = pathname === '/' ? 'index.html' : pathname.slice(1);
      if (serveStatic(res, PUBLIC_DIR, rel)) return;
      return send(res, 404, { ok: false, errors: ['not found'] });
    }

    send(res, 405, { ok: false, errors: ['method not allowed'] });
  } catch (err) {
    send(res, 500, { ok: false, errors: [String(err?.message || err)] });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`CSV admin UI: http://${HOST}:${PORT}`);
  console.log('This tool writes directly to data/*.csv — local development only.');
});
