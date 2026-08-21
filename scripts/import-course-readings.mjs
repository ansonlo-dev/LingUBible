#!/usr/bin/env bun
/**
 * 匯入課程「指定 / 建議閱讀書目」資料到 Appwrite `courses` 表的 `readings` 欄位。
 *
 * 資料來源：input_chunk_*.json（{ COURSE_CODE: [{TYPE, FULL_NAME, SOURCE}, ...] }）。
 *
 * 設計重點：
 * - 只新增 / 寫入 `readings` 這一個欄位，其餘欄位與其他資料表完全不動。
 * - 來源檔沒有的課程，其 `readings` 保持原樣（預設 null）。
 * - 可重複執行：已相同的內容會跳過，不會浪費請求。
 *
 * 用法：
 *   bun scripts/import-course-readings.mjs [--dry-run] <input_chunk_1.json> [更多檔案...]
 */

import { readFileSync, existsSync } from 'node:fs';
import { Client, TablesDB, Query } from 'node-appwrite';

const DATABASE_ID = 'lingubible';
const TABLE_ID = 'courses';
const COLUMN_KEY = 'readings';
const COLUMN_SIZE = 65536;

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const value = m[2].replace(/^["']|["']$/g, '');
      if (value && !process.env[m[1]]) process.env[m[1]] = value;
    }
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  loadEnv();
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const files = args.filter((a) => !a.startsWith('--'));
  if (files.length === 0) {
    console.error('用法: bun scripts/import-course-readings.mjs [--dry-run] <input_chunk_1.json> ...');
    process.exit(1);
  }

  // ---- 讀取來源檔，合併成 code -> minified JSON ----
  const readings = new Map();
  for (const file of files) {
    const data = JSON.parse(readFileSync(file, 'utf8'));
    for (const [code, list] of Object.entries(data)) {
      if (!Array.isArray(list) || list.length === 0) continue;
      const minified = JSON.stringify(list);
      if (minified.length > COLUMN_SIZE) {
        throw new Error(`${code} 的 readings 長度 ${minified.length} 超過欄位上限 ${COLUMN_SIZE}`);
      }
      readings.set(code.trim().toUpperCase(), minified);
    }
    console.log(`📄 ${file}: ${Object.keys(data).length} 門課`);
  }
  console.log(`📚 來源合計 ${readings.size} 門課有書目資料`);

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);
  const tablesDB = new TablesDB(client);

  // ---- 1. 確保 readings 欄位存在 ----
  const table = await tablesDB.getTable({ databaseId: DATABASE_ID, tableId: TABLE_ID });
  const existing = table.columns.find((c) => c.key === COLUMN_KEY);
  if (existing) {
    console.log(`✅ 欄位 ${COLUMN_KEY} 已存在（type=${existing.type}, size=${existing.size}, status=${existing.status}）`);
  } else if (dryRun) {
    console.log(`🔍 [dry-run] 會建立欄位 ${COLUMN_KEY} (string, size=${COLUMN_SIZE}, 非必填, 無預設值)`);
  } else {
    await tablesDB.createStringColumn({
      databaseId: DATABASE_ID,
      tableId: TABLE_ID,
      key: COLUMN_KEY,
      size: COLUMN_SIZE,
      required: false,
    });
    console.log(`🆕 已建立欄位 ${COLUMN_KEY} (string, size=${COLUMN_SIZE})，等待就緒…`);
    for (let i = 0; i < 30; i++) {
      await sleep(1000);
      const col = await tablesDB.getColumn({ databaseId: DATABASE_ID, tableId: TABLE_ID, key: COLUMN_KEY });
      if (col.status === 'available') { console.log('✅ 欄位已就緒'); break; }
      if (col.status === 'failed') throw new Error('欄位建立失敗');
    }
  }

  // ---- 2. 讀取全部課程列 ----
  const rows = [];
  let cursor = null;
  while (true) {
    const queries = [Query.limit(100), Query.orderAsc('course_code')];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const res = await tablesDB.listRows({ databaseId: DATABASE_ID, tableId: TABLE_ID, queries });
    rows.push(...res.rows);
    if (res.rows.length < 100) break;
    cursor = res.rows[res.rows.length - 1].$id;
  }
  console.log(`🗄️  資料庫共 ${rows.length} 門課`);

  // ---- 3. 寫入 ----
  let updated = 0, skipped = 0, unchanged = 0;
  const matched = new Set();
  for (const row of rows) {
    const code = String(row.course_code || '').trim().toUpperCase();
    const value = readings.get(code);
    if (!value) { skipped++; continue; }
    matched.add(code);
    if (row[COLUMN_KEY] === value) { unchanged++; continue; }
    if (dryRun) { updated++; continue; }
    await tablesDB.updateRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_ID,
      rowId: row.$id,
      data: { [COLUMN_KEY]: value },
    });
    updated++;
    if (updated % 25 === 0) console.log(`   …已更新 ${updated} 列`);
  }

  const missing = [...readings.keys()].filter((c) => !matched.has(c)).sort();
  console.log('\n──────── 結果 ────────');
  console.log(`${dryRun ? '[dry-run] 會更新' : '已更新'}：${updated} 列`);
  console.log(`內容相同略過：${unchanged} 列`);
  console.log(`來源無資料、保持原值(null)：${skipped} 列`);
  if (missing.length) {
    console.log(`⚠️  來源有但資料庫查無此課程代碼 (${missing.length})：${missing.join(', ')}`);
  } else {
    console.log('✅ 來源檔中的每一門課都在資料庫找到對應列');
  }
}

main().catch((e) => { console.error('❌', e); process.exit(1); });
