// === Osaka Cafe Search API (Cloudflare Workers) ===
// 必要な環境変数：HOTPEPPER_API_KEY（Secret）, HOTPEPPER_GENRE=G014（Variable）
// D1 バインディング：DB（新DBに接続）

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

    // ---- ETL: 大阪府 全域取り込み（service_area=SA23 × genre=G014）----
    // 叩き方: GET/POST /etl
    if (url.pathname === "/etl" && (req.method === "POST" || req.method === "GET")) {
      await fetchLoop(env, { service_area: "SA23", genre: env.HOTPEPPER_GENRE }); // SA23=大阪府
      return json({ ok: true, mode: "osaka-service-area" });
    }

    // ---- 検索API: /search?middle=...&small=...&parking=has|none|any&smoking=non_smoking|has_non_smoking|any&limit=50 ----
    if (url.pathname === "/search") {
      return search(req, env);
    }

    // ---- エリア一覧（UI候補用）: /areas ----
    // ---- エリア一覧（大阪版：地名で返す。DBに存在するコードのみ） ----
    if (url.pathname === "/areas") {
      const mids = await env.DB.prepare(
        `SELECT DISTINCT middle_area_code AS code,
                         COALESCE(middle_area_name, middle_area_code) AS name
         FROM shops
         WHERE middle_area_code IS NOT NULL`
      ).all();
    
      const smalls = await env.DB.prepare(
        `SELECT DISTINCT small_area_code AS code,
                         COALESCE(small_area_name, small_area_code) AS name
         FROM shops
         WHERE small_area_code IS NOT NULL`
      ).all();
    
      // name でソートして返す
      const middle = (mids.results ?? []).sort((a,b)=> (a.name||'').localeCompare(b.name||'','ja'));
      const small  = (smalls.results ?? []).sort((a,b)=> (a.name||'').localeCompare(b.name||'','ja'));
    
      return json({ middle, small });
    }

    // 既存の fetch に追加:
  if (url.pathname === "/area_counts") {
    return areaCounts(req, env);
  }

  // ルータに追加
if (url.pathname === "/areas_tree") {
  return areasTree(req, env);
}

// 実装
async function areasTree(req, env) {
  const url = new URL(req.url);
  const parking = url.searchParams.get("parking") ?? "any";
  const smoking = url.searchParams.get("smoking") ?? "any";

  const where = [];
  if (parking === "has")  where.push(`parking LIKE '%あり%'`);
  if (parking === "none") where.push(`parking LIKE '%なし%'`);
  if (smoking === "non_smoking")     where.push(`non_smoking LIKE '%全面禁煙%'`);
  if (smoking === "has_non_smoking") where.push(`non_smoking LIKE '%禁煙%'`);

  const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";

  // 中エリア（名前付き・件数付き）
  const midsSql = `
    SELECT
      middle_area_code AS code,
      COALESCE(middle_area_name, middle_area_code) AS name,
      COUNT(*) AS cnt
    FROM shops
    ${whereSql}
    GROUP BY middle_area_code, middle_area_name
  `;
  const { results: mids } = await env.DB.prepare(midsSql).all();

  // 小エリア（中エリアごと、名前付き・件数付き）
  const smallSql = `
    SELECT
      middle_area_code AS middle,
      small_area_code AS code,
      COALESCE(small_area_name, small_area_code) AS name,
      COUNT(*) AS cnt
    FROM shops
    ${whereSql}
    GROUP BY middle_area_code, small_area_code, small_area_name
  `;
  const { results: smalls } = await env.DB.prepare(smallSql).all();

  // ツリー化
  const map = new Map();
  for (const m of (mids ?? [])) {
    map.set(m.code, { code: m.code, name: m.name, cnt: Number(m.cnt), small: [] });
  }
  for (const s of (smalls ?? [])) {
    if (!map.has(s.middle)) {
      map.set(s.middle, { code: s.middle, name: s.middle, cnt: 0, small: [] });
    }
    map.get(s.middle).small.push({ code: s.code, name: s.name, cnt: Number(s.cnt) });
  }

  const middle = Array.from(map.values())
    .map(m => ({ ...m, small: m.small.sort((a,b)=> (a.name||'').localeCompare(b.name||'','ja')) }))
    .sort((a,b)=> (a.name||'').localeCompare(b.name||'','ja'));

  return json({ middle });
}


// 新規: 件数 API 本体
async function areaCounts(req, env) {
  const url = new URL(req.url);
  const selectedMiddle = (url.searchParams.get("middle") ?? "")
    .split(",").filter(Boolean); // 小エリア集計時の絞り込み
  const parking = url.searchParams.get("parking") ?? "any";
  const smoking = url.searchParams.get("smoking") ?? "any";

  // where の共通部分（検索APIと同じルール）
  const where = [];
  const params = [];

  if (parking === "has")  where.push(`parking LIKE '%あり%'`);
  if (parking === "none") where.push(`parking LIKE '%なし%'`);

  if (smoking === "non_smoking")     where.push(`non_smoking LIKE '%全面禁煙%'`);
  if (smoking === "has_non_smoking") where.push(`non_smoking LIKE '%禁煙%'`);

  const whereSQL = where.length ? "WHERE " + where.join(" AND ") : "";

  // 中エリアごとの件数
  const midSQL = `
    SELECT middle_area_code AS code, COUNT(*) AS cnt
    FROM shops
    ${whereSQL}
    GROUP BY middle_area_code
  `;
  const mids = await env.DB.prepare(midSQL).bind(...params).all();

  // 小エリアごとの件数（中エリアで絞る場合あり）
  const whereSmall = [...where];
  const paramsSmall = [...params];
  if (selectedMiddle.length) {
    whereSmall.push(`middle_area_code IN (${selectedMiddle.map(()=>'?').join(',')})`);
    paramsSmall.push(...selectedMiddle);
  }
  const whereSmallSQL = whereSmall.length ? "WHERE " + whereSmall.join(" AND ") : "";
  const smallSQL = `
    SELECT small_area_code AS code, COUNT(*) AS cnt
    FROM shops
    ${whereSmallSQL}
    GROUP BY small_area_code
  `;
  const smalls = await env.DB.prepare(smallSQL).bind(...paramsSmall).all();

  return json({
    middle: (mids.results ?? []).filter(r => r.code),
    small : (smalls.results ?? []).filter(r => r.code),
  });
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
async function fetchLoop(env, baseParams) {
  let start = 1;
  while (true) {
    const data = await fetchPage(env, { ...baseParams, start: String(start), count: "100" });
    const shops = data?.results?.shop ?? [];
    if (!shops.length) break;
    await upsertShops(env, shops);

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
async function upsertShops(env, arr) {
  const now = Math.floor(Date.now() / 1000);
  const base = `
    INSERT INTO shops (
      id,name,name_kana,address,lat,lng,
      large_area_code,middle_area_code,small_area_code,genre_code,
      budget_avg,capacity,non_smoking,wifi,parking,
      open_text,close_text,catch_text,urls_pc,photo_l,updated_at,
      middle_area_name, small_area_name
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name,
      name_kana=excluded.name_kana,
      address=excluded.address,
      lat=excluded.lat, lng=excluded.lng,
      large_area_code=excluded.large_area_code,
      middle_area_code=excluded.middle_area_code,
      small_area_code=excluded.small_area_code,
      genre_code=excluded.genre_code,
      budget_avg=excluded.budget_avg,
      capacity=excluded.capacity,
      non_smoking=excluded.non_smoking,
      wifi=excluded.wifi,
      parking=excluded.parking,
      open_text=excluded.open_text,
      close_text=excluded.close_text,
      catch_text=excluded.catch_text,
      urls_pc=excluded.urls_pc,
      photo_l=excluded.photo_l,
      updated_at=excluded.updated_at,
      middle_area_name=excluded.middle_area_name,
      small_area_name=excluded.small_area_name
  `;

  const chunkSize = 100;
  for (let i = 0; i < arr.length; i += chunkSize) {
    const chunk = arr.slice(i, i + chunkSize);
    const stmts = chunk.map((s) => {
      const vals = [
        s.id,
        s.name ?? null,
        s.name_kana ?? null,
        s.address ?? null,
        Number(s.lat), Number(s.lng),
        s.large_area?.code ?? null,
        s.middle_area?.code ?? null,
        s.small_area?.code ?? null,
        s.genre?.code ?? null,
        s.budget?.average ? Number(s.budget.average) : null,
        s.capacity ?? null,
        s.non_smoking ?? null,
        s.wifi ?? null,
        s.parking ?? null,
        s.open ?? null,
        s.close ?? null,
        s.catch ?? null,
        s.urls?.pc ?? null,
        s.photo?.pc?.l ?? null,
        now,
        s.middle_area?.name ?? null,   // 22個目
        s.small_area?.name ?? null     // 23個目
      ];
      return env.DB.prepare(base).bind(...vals);
    });
    await env.DB.batch(stmts);
  }
}

// 検索
async function search(req, env) {
  const url = new URL(req.url);

  // 15件固定
  const PAGE_SIZE = 15;

  const middle  = (url.searchParams.get("middle") ?? "").split(",").filter(Boolean);
  const small   = (url.searchParams.get("small")  ?? "").split(",").filter(Boolean);
  const parking = url.searchParams.get("parking") ?? "any";   // has/none/any
  const smoking = url.searchParams.get("smoking") ?? "any";   // non_smoking/has_non_smoking/any
  const page    = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const offset  = (page - 1) * PAGE_SIZE;

  const where = [];
  const params = [];

  if (middle.length) { where.push(`middle_area_code IN (${middle.map(()=>'?').join(',')})`); params.push(...middle); }
  if (small.length)  { where.push(`small_area_code  IN (${small.map(()=>'?').join(',')})`);  params.push(...small); }

  if (parking === "has")  where.push(`parking LIKE '%あり%'`);
  if (parking === "none") where.push(`parking LIKE '%なし%'`);

  if (smoking === "non_smoking")     where.push(`non_smoking LIKE '%全面禁煙%'`);
  if (smoking === "has_non_smoking") where.push(`non_smoking LIKE '%禁煙%'`);

  const whereSql = where.length ? ("WHERE " + where.join(" AND ")) : "";

  // 総件数
  const cnt = await env.DB.prepare(`SELECT COUNT(*) AS c FROM shops ${whereSql}`).bind(...params).first();
  const total = Number(cnt?.c ?? 0);
  const total_pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // データ本体
  const sql = `
    SELECT id,name,address,lat,lng,capacity,budget_avg,non_smoking,wifi,parking,urls_pc,photo_l
    FROM shops
    ${whereSql}
    LIMIT ? OFFSET ?`;
  const dataParams = [...params, PAGE_SIZE, offset];
  const rows = await env.DB.prepare(sql).bind(...dataParams).all();

  return json({
    total,
    page,
    total_pages,
    page_size: PAGE_SIZE,
    items: rows.results ?? [],
  });
}
