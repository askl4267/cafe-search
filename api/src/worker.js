// === Osaka Cafe Search API (Cloudflare Workers) ===
// 必要な環境変数：HOTPEPPER_API_KEY（Secret）, HOTPEPPER_GENRE=G014（Variable）
// D1 バインディング：DB（新DBに接続）

import { and, eq, inArray, isNotNull, like, sql } from "drizzle-orm";
import { getDb } from "./db/client";
import { shops } from "./db/schema";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type",
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...CORS },
  });
}

// 先頭付近の定数に追加（ファイルのどこでもOK）
const OSAKA_SERVICE_AREA = "SA23"; // 大阪府
const PARKING_HAS_PATTERN = "%駐車%";
const PARKING_NONE_PATTERN = "%なし%";
const NON_SMOKING_ONLY_PATTERN = "%全席禁煙%";
const HAS_NON_SMOKING_PATTERN = "%禁煙%";

// 県内の「中エリア」を取得（名前つき）
async function fetchMiddleAreasOsaka(env) {
  const url = new URL("https://webservice.recruit.co.jp/hotpepper/middle_area/v1/");
  url.searchParams.set("key", env.HOTPEPPER_API_KEY);
  url.searchParams.set("format", "json");
  url.searchParams.set("service_area", OSAKA_SERVICE_AREA); // ←大阪
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("middle_area API " + res.status);
  const data = await res.json();
  const arr = data?.results?.middle_area ?? [];
  // {code, name} に揃える
  return arr.map(a => ({ code: a.code, name: a.name })).filter(x => x.code && x.name);
}

// 中エリアごとの「小エリア」を取得（名前つき）
async function fetchSmallAreasByMiddle(env, middleCode) {
  const url = new URL("https://webservice.recruit.co.jp/hotpepper/small_area/v1/");
  url.searchParams.set("key", env.HOTPEPPER_API_KEY);
  url.searchParams.set("format", "json");
  url.searchParams.set("middle_area", middleCode);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("small_area API " + res.status);
  const data = await res.json();
  const arr = data?.results?.small_area ?? [];
  // {code, name, parent} に揃える（parent=中エリア）
  return arr.map(a => ({ code: a.code, name: a.name, parent: middleCode }))
            .filter(x => x.code && x.name);
}

// 大阪の中/小エリア名をまとめて取得
async function loadOsakaAreaNames(env) {
  const middles = await fetchMiddleAreasOsaka(env);
  const smallsAll = [];
  // 直列で十分（レート控えめ）。速くしたければ Promise.all にしてOK
  for (const m of middles) {
    const s = await fetchSmallAreasByMiddle(env, m.code);
    smallsAll.push(...s);
  }
  return { middles, smalls: smallsAll };
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    // CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    const db = getDb(env);

    // ---- ETL: 大阪府 全域取り込み（service_area=SA23 × genre=G014）----
    // 叩き方: GET/POST /etl
    if (url.pathname === "/etl" && (req.method === "POST" || req.method === "GET")) {
      await fetchLoop(env, db, { service_area: "SA23", genre: env.HOTPEPPER_GENRE }); // SA23=大阪府
      return json({ ok: true, mode: "osaka-service-area" });
    }

    // ---- 検索API: /search?middle=...&small=...&parking=has|none|any&smoking=non_smoking|has_non_smoking|any&limit=50 ----
    if (url.pathname === "/search") {
      return search(req, env, db);
    }

    if (url.pathname === "/shop" && req.method === "GET") {
      const id = url.searchParams.get("id");
      if (!id) return json({ error: "missing id" }, 400);

      const rows = await db
        .select({
          id: shops.id,
          name: shops.name,
          name_kana: shops.nameKana,
          address: shops.address,
          lat: shops.lat,
          lng: shops.lng,
          large_area_code: shops.largeAreaCode,
          middle_area_code: shops.middleAreaCode,
          small_area_code: shops.smallAreaCode,
          genre_code: shops.genreCode,
          budget_avg: shops.budgetAvg,
          capacity: shops.capacity,
          non_smoking: shops.nonSmoking,
          wifi: shops.wifi,
          parking: shops.parking,
          open_text: shops.openText,
          close_text: shops.closeText,
          catch_text: shops.catchText,
          urls_pc: shops.urlsPc,
          photo_l: shops.photoL,
          updated_at: shops.updatedAt,
          middle_area_name: shops.middleAreaName,
          small_area_name: shops.smallAreaName,
        })
        .from(shops)
        .where(eq(shops.id, id))
        .limit(1);

      const row = rows[0];
      if (!row) return json({ error: "not found" }, 404);
      return json({ item: row });
    }

    // ---- エリア一覧（UI候補用）: /areas ----
    // ---- エリア一覧（大阪版：地名で返す。DBに存在するコードのみ） ----
    if (url.pathname === "/areas") {
      const middleRows = await db
        .selectDistinct({
          code: shops.middleAreaCode,
          name: sql`COALESCE(${shops.middleAreaName}, ${shops.middleAreaCode})`.as("name"),
        })
        .from(shops)
        .where(isNotNull(shops.middleAreaCode));

      const smallRows = await db
        .selectDistinct({
          code: shops.smallAreaCode,
          name: sql`COALESCE(${shops.smallAreaName}, ${shops.smallAreaCode})`.as("name"),
        })
        .from(shops)
        .where(isNotNull(shops.smallAreaCode));

      const middle = middleRows
        .filter(r => r.code)
        .sort((a,b)=> (a.name||'').localeCompare(b.name||'', 'ja'));
      const small = smallRows
        .filter(r => r.code)
        .sort((a,b)=> (a.name||'').localeCompare(b.name||'', 'ja'));

      return json({ middle, small });
    }

    if (url.pathname === "/area_counts") {
      return areaCounts(req, env, db);
    }

    if (url.pathname === "/areas_tree") {
      return areasTree(req, env, db);
    }


    // ---- 簡易UI（大阪版） ----
    if (url.pathname === "/") {
      const html = `
<!doctype html><meta charset="utf-8">
<title>大阪カフェ検索（MVP）</title>
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto;margin:24px;max-width:960px}
  h1{margin:0 0 8px}
  .row{display:flex;gap:12px;flex-wrap:wrap;margin:12px 0}
  select,button{font-size:14px;padding:6px 8px}
  #result .card{display:flex;gap:12px;border:1px solid #eee;border-radius:12px;padding:12px;margin:8px 0}
  #result img{width:120px;height:90px;object-fit:cover;border-radius:8px}
  small{color:#666}
</style>
<h1>大阪カフェ検索（MVP）</h1>
<p><small>中エリア/小エリアを選び、必要なら駐車/禁煙を指定して「検索」を押してください。</small></p>

<div class="row">
  <label>中エリア<br>
    <select id="middle" multiple size="5" style="min-width:220px"></select>
  </label>
  <label>小エリア<br>
    <select id="small" multiple size="8" style="min-width:220px"></select>
  </label>
</div>

<div class="row">
  <label>駐車
    <select id="parking">
      <option value="any">指定なし</option>
      <option value="has">あり</option>
      <option value="none">なし</option>
    </select>
  </label>
  <label>禁煙
    <select id="smoking">
      <option value="any">指定なし</option>
      <option value="non_smoking">全面禁煙</option>
      <option value="has_non_smoking">禁煙席あり（ゆるめ）</option>
    </select>
  </label>
  <button id="search">検索</button>
</div>

<div class="row" style="align-items:end">
  <label>1ページの件数
    <select id="limit">
      <option>12</option>
      <option selected>24</option>
      <option>50</option>
      <option>100</option>
    </select>
  </label>
  <div style="margin-left:auto; display:flex; gap:8px; align-items:center">
    <button id="prev">前へ</button>
    <span id="pageInfo"></span>
    <button id="next">次へ</button>
  </div>
</div>

<div id="result"></div>

<script>
(function(){
  'use strict';

  var currentPage = 1;

  function $(id){ return document.getElementById(id); }

  function setText(el, text){ el.textContent = (text == null ? '' : String(text)); }

  function createEl(tag, attrs, text){
    var el = document.createElement(tag);
    if (attrs){
      for (var k in attrs){
        if (k === 'class') el.className = attrs[k];
        else if (k === 'style') el.setAttribute('style', attrs[k]);
        else el.setAttribute(k, attrs[k]);
      }
    }
    if (text != null) setText(el, text);
    return el;
  }

  function buildCard(item){
    var card = createEl('div', {class: 'card'});

    var img = createEl('img', {alt: ''});
    img.src = item.photo_l || '';
    card.appendChild(img);

    var box = createEl('div');
    var name = createEl('div');
    var strong = createEl('strong', null, item.name || '');
    name.appendChild(strong);
    box.appendChild(name);

    var addr = createEl('div', null, item.address || '');
    box.appendChild(addr);

    var meta = createEl(
      'div',
      null,
      '禁煙: ' + (item.non_smoking || '不明') +
      ' / Wi-Fi: ' + (item.wifi || '不明') +
      ' / 駐車: ' + (item.parking || '不明')
    );
    box.appendChild(meta);

    var linkWrap = createEl('div');
    var a = createEl('a', {href: item.urls_pc || '#', target: '_blank', rel: 'noopener'}, 'HotPepperで見る');
    linkWrap.appendChild(a);
    box.appendChild(linkWrap);

    card.appendChild(box);
    return card;
  }

  function selectedValues(sel){
    if (!sel) return '';
    var out = [];
    var opts = sel.selectedOptions || [];
    for (var i=0;i<opts.length;i++) out.push(opts[i].value);
    return out.join(',');
  }

  async function loadAreas(){
    try{
      const r = await fetch('/areas');
      const j = await r.json();
      const mid = document.getElementById('middle');
      const sm  = document.getElementById('small');
  
      if (mid && Array.isArray(j.middle)) {
        // 地名順で表示（nameでソート）
        j.middle.slice().sort((a,b)=> (a.name||'').localeCompare(b.name||'','ja'))
          .forEach(x=>{
            const o = document.createElement('option');
            o.value = x.code;            // ← 検索はコードで
            o.textContent = x.name;      // ← 表示は地名
            mid.appendChild(o);
          });
      }
      if (sm && Array.isArray(j.small)) {
        j.small.slice().sort((a,b)=> (a.name||'').localeCompare(b.name||'','ja'))
          .forEach(x=>{
            const o = document.createElement('option');
            o.value = x.code;            // ← 検索はコードで
            o.textContent = x.name;      // ← 表示は地名
            sm.appendChild(o);
          });
      }
    }catch(e){
      console.error('loadAreas failed', e);
    }
  }
  

  async function run(page){
    if (page == null) page = 1;
    currentPage = page;

    var qs = new URLSearchParams({
      middle:  selectedValues($('middle')),
      small:   selectedValues($('small')),
      parking: ($('parking') && $('parking').value) || 'any',
      smoking: ($('smoking') && $('smoking').value) || 'any',
      limit:   ($('limit') && $('limit').value) || '24',
      page:    String(currentPage)
    });

    try{
      var res = await fetch('/search?' + qs.toString());
      var j = await res.json();

      var box = $('result');
      if (box){
        box.innerHTML = '';
        var summary = createEl('p', null, '該当: ' + (j.total||0) + ' 件（' + (j.page||1) + '/' + (j.total_pages||1) + '）');
        box.appendChild(summary);

        (j.items || []).forEach(function(item){
          box.appendChild(buildCard(item));
        });
      }

      var pageInfo = $('pageInfo');
      if (pageInfo) setText(pageInfo, (j.page||1) + ' / ' + (j.total_pages||1));

      var prev = $('prev'), next = $('next');
      if (prev) prev.disabled = (j.page <= 1);
      if (next) next.disabled = (j.page >= j.total_pages);

      // ページ移動時に上に少しスクロール（任意）
      try{ window.scrollTo({ top: 0, behavior: 'smooth' }); }catch(_){}
    }catch(e){
      console.error('search failed', e);
    }
  }

  document.addEventListener('DOMContentLoaded', function(){
    var searchBtn = $('search');
    var prev = $('prev'), next = $('next');
    var limit = $('limit');

    if (searchBtn) searchBtn.addEventListener('click', function(){ run(1); });
    if (prev) prev.addEventListener('click', function(){ run(currentPage - 1); });
    if (next) next.addEventListener('click', function(){ run(currentPage + 1); });
    if (limit) limit.addEventListener('change', function(){ run(1); });

    loadAreas();
    // 初回ロード時に自動検索したければ有効化：
    // run(1);
  });
})();
</script>
`;
      return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" }});
    }

    // default
    return new Response("OK (try GET /etl, /search, /areas, or open / )", { status: 200, headers: CORS });
  },
};

// ===== Hot Pepper client =====
const HP_ENDPOINT = "https://webservice.recruit.co.jp/hotpepper/gourmet/v1/";

async function fetchPage(env, params) {
  const qs = new URLSearchParams({
    key: env.HOTPEPPER_API_KEY,
    format: "json",
    count: "100",
    ...params,
  });
  const res = await fetch(`${HP_ENDPOINT}?${qs.toString()}`);
  if (!res.ok) throw new Error(`HotPepper API ${res.status}`);
  return res.json();
}

// 大阪全域を最後までページング取得してUPSERT
async function fetchLoop(env, db, baseParams) {
  let start = 1;
  while (true) {
    const data = await fetchPage(env, { ...baseParams, start: String(start), count: "100" });
    const shops = data?.results?.shop ?? [];
    if (!shops.length) break;
    await upsertShops(db, shops);

    const ret = Number(data?.results?.results_returned ?? "0");
    const avail = Number(data?.results?.results_available ?? "0");
    const next = start + ret;
    if (next > avail) break;
    start = next;

    // 連続アクセスを緩和（任意）
    await new Promise(r => setTimeout(r, 200));
  }
}

// D1 UPSERT
async function upsertShops(db, arr) {
  const now = Math.floor(Date.now() / 1000);
  const chunkSize = 40;

  for (let i = 0; i < arr.length; i += chunkSize) {
    const chunk = arr.slice(i, i + chunkSize).map((shop) => mapHotPepperShop(shop, now));
    if (!chunk.length) continue;

    await db
      .insert(shops)
      .values(chunk)
      .onConflictDoUpdate({
        target: shops.id,
        set: UPSERT_UPDATE_SET,
      })
      .run();
  }
}

async function areasTree(req, env, db) {
  const url = new URL(req.url);
  const parking = url.searchParams.get("parking") ?? "any";
  const smoking = url.searchParams.get("smoking") ?? "any";

  const whereClause = combineFilters(
    buildAmenityFilters({ parking, smoking })
  );

  const middleRows = await applyWhere(
    db
      .select({
        code: shops.middleAreaCode,
        name: sql`COALESCE(${shops.middleAreaName}, ${shops.middleAreaCode})`.as("name"),
        cnt: sql`COUNT(*)`.as("cnt"),
      })
      .from(shops),
    whereClause
  ).groupBy(shops.middleAreaCode, shops.middleAreaName);

  const smallRows = await applyWhere(
    db
      .select({
        middle: shops.middleAreaCode,
        code: shops.smallAreaCode,
        name: sql`COALESCE(${shops.smallAreaName}, ${shops.smallAreaCode})`.as("name"),
        cnt: sql`COUNT(*)`.as("cnt"),
      })
      .from(shops),
    whereClause
  ).groupBy(shops.middleAreaCode, shops.smallAreaCode, shops.smallAreaName);

  const aggregated = new Map();

  for (const row of middleRows ?? []) {
    if (!row.code) continue;
    aggregated.set(row.code, {
      code: row.code,
      name: row.name ?? row.code,
      cnt: Number(row.cnt ?? 0),
      small: [],
    });
  }

  for (const row of smallRows ?? []) {
    if (!row.middle || !row.code) continue;
    if (!aggregated.has(row.middle)) {
      aggregated.set(row.middle, {
        code: row.middle,
        name: row.middle,
        cnt: 0,
        small: [],
      });
    }
    const parent = aggregated.get(row.middle);
    if (!parent) continue;
    parent.small.push({
      code: row.code,
      name: row.name ?? row.code,
      cnt: Number(row.cnt ?? 0),
    });
  }

  const middle = Array.from(aggregated.values())
    .map((m) => ({
      ...m,
      small: m.small.sort((a, b) => (a.name || "").localeCompare(b.name || "", "ja")),
    }))
    .sort((a, b) => (a.name || "").localeCompare(b.name || "", "ja"));

  return json({ middle });
}

async function areaCounts(req, env, db) {
  const url = new URL(req.url);
  const selectedMiddle = (url.searchParams.get("middle") ?? "")
    .split(",")
    .filter(Boolean);
  const parking = url.searchParams.get("parking") ?? "any";
  const smoking = url.searchParams.get("smoking") ?? "any";

  const baseFilters = buildAmenityFilters({ parking, smoking });
  const middleWhere = combineFilters(baseFilters);

  const middleRows = await applyWhere(
    db
      .select({
        code: shops.middleAreaCode,
        cnt: sql`COUNT(*)`.as("cnt"),
      })
      .from(shops),
    middleWhere
  ).groupBy(shops.middleAreaCode);

  const smallFilters = [...baseFilters];
  if (selectedMiddle.length) {
    smallFilters.push(inArray(shops.middleAreaCode, selectedMiddle));
  }
  const smallWhere = combineFilters(smallFilters);

  const smallRows = await applyWhere(
    db
      .select({
        code: shops.smallAreaCode,
        cnt: sql`COUNT(*)`.as("cnt"),
      })
      .from(shops),
    smallWhere
  ).groupBy(shops.smallAreaCode);

  return json({
    middle: (middleRows ?? []).filter((r) => r.code),
    small: (smallRows ?? []).filter((r) => r.code),
  });
}

// 検索
async function search(req, env, db) {
  const url = new URL(req.url);

  const PAGE_SIZE = 15;

  const middle = (url.searchParams.get("middle") ?? "").split(",").filter(Boolean);
  const small = (url.searchParams.get("small") ?? "").split(",").filter(Boolean);
  const parking = url.searchParams.get("parking") ?? "any";
  const smoking = url.searchParams.get("smoking") ?? "any";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  const whereClause = combineFilters(
    buildSearchFilters({ middle, small, parking, smoking })
  );

  const countRows = await applyWhere(
    db.select({ value: sql`COUNT(*)`.as("value") }).from(shops),
    whereClause
  );
  const total = Number(countRows[0]?.value ?? 0);
  const total_pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const items = await applyWhere(
    db
      .select({
        id: shops.id,
        name: shops.name,
        address: shops.address,
        lat: shops.lat,
        lng: shops.lng,
        capacity: shops.capacity,
        budget_avg: shops.budgetAvg,
        non_smoking: shops.nonSmoking,
        wifi: shops.wifi,
        parking: shops.parking,
        urls_pc: shops.urlsPc,
        photo_l: shops.photoL,
      })
      .from(shops),
    whereClause
  )
    .limit(PAGE_SIZE)
    .offset(offset);

  return json({
    total,
    page,
    total_pages,
    page_size: PAGE_SIZE,
    items,
  });
}


function buildSearchFilters({ middle = [], small = [], parking, smoking }) {
  const filters = [];
  if (Array.isArray(middle) && middle.length) {
    filters.push(inArray(shops.middleAreaCode, middle));
  }
  if (Array.isArray(small) && small.length) {
    filters.push(inArray(shops.smallAreaCode, small));
  }
  filters.push(...buildAmenityFilters({ parking, smoking }));
  return filters;
}

function buildAmenityFilters({ parking, smoking }) {
  const filters = [];
  if (parking === "has") {
    filters.push(like(shops.parking, PARKING_HAS_PATTERN));
  }
  if (parking === "none") {
    filters.push(like(shops.parking, PARKING_NONE_PATTERN));
  }
  if (smoking === "non_smoking") {
    filters.push(like(shops.nonSmoking, NON_SMOKING_ONLY_PATTERN));
  }
  if (smoking === "has_non_smoking") {
    filters.push(like(shops.nonSmoking, HAS_NON_SMOKING_PATTERN));
  }
  return filters;
}

function combineFilters(filters) {
  if (!filters.length) return undefined;
  return filters.length === 1 ? filters[0] : and(...filters);
}

function applyWhere(builder, condition) {
  return condition ? builder.where(condition) : builder;
}

function mapHotPepperShop(shop, now) {
  return {
    id: shop.id,
    name: shop.name ?? null,
    nameKana: shop.name_kana ?? null,
    address: shop.address ?? null,
    lat: Number(shop.lat),
    lng: Number(shop.lng),
    largeAreaCode: shop.large_area?.code ?? null,
    middleAreaCode: shop.middle_area?.code ?? null,
    smallAreaCode: shop.small_area?.code ?? null,
    genreCode: shop.genre?.code ?? null,
    budgetAvg: shop.budget?.average ? Number(shop.budget.average) : null,
    capacity: shop.capacity ?? null,
    nonSmoking: shop.non_smoking ?? null,
    wifi: shop.wifi ?? null,
    parking: shop.parking ?? null,
    openText: shop.open ?? null,
    closeText: shop.close ?? null,
    catchText: shop.catch ?? null,
    urlsPc: shop.urls?.pc ?? null,
    photoL: shop.photo?.pc?.l ?? null,
    updatedAt: now,
    middleAreaName: shop.middle_area?.name ?? null,
    smallAreaName: shop.small_area?.name ?? null,
  };
}

const UPSERT_UPDATE_SET = {
  name: sql`excluded.name`,
  nameKana: sql`excluded.name_kana`,
  address: sql`excluded.address`,
  lat: sql`excluded.lat`,
  lng: sql`excluded.lng`,
  largeAreaCode: sql`excluded.large_area_code`,
  middleAreaCode: sql`excluded.middle_area_code`,
  smallAreaCode: sql`excluded.small_area_code`,
  genreCode: sql`excluded.genre_code`,
  budgetAvg: sql`excluded.budget_avg`,
  capacity: sql`excluded.capacity`,
  nonSmoking: sql`excluded.non_smoking`,
  wifi: sql`excluded.wifi`,
  parking: sql`excluded.parking`,
  openText: sql`excluded.open_text`,
  closeText: sql`excluded.close_text`,
  catchText: sql`excluded.catch_text`,
  urlsPc: sql`excluded.urls_pc`,
  photoL: sql`excluded.photo_l`,
  updatedAt: sql`excluded.updated_at`,
  middleAreaName: sql`excluded.middle_area_name`,
  smallAreaName: sql`excluded.small_area_name`,
};
