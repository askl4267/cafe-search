import { sql } from "drizzle-orm";
import { applyWhere, buildSearchFilters, combineFilters } from "../utils/filters";
import { shops } from "../db/schema";
import { json } from "../utils/response";
import { parseBoundedInt, parseListParam, parseStringParam } from "../utils/query";

const PAGE_SIZE = 15;

export async function handleSearch(req, env, db) {
  const url = new URL(req.url);

  const middle = parseListParam(url, "middle");
  const small = parseListParam(url, "small");
  const parking = parseStringParam(url, "parking", "any");
  const smoking = parseStringParam(url, "smoking", "any");
  const page = parseBoundedInt(url.searchParams.get("page"), { fallback: 1, min: 1 });
  const offset = (page - 1) * PAGE_SIZE;

  // パラメータに応じた WHERE 句を組み立てる
  const whereClause = combineFilters(buildSearchFilters({ middle, small, parking, smoking }));

  // 件数は同じ条件で集計し、ページング情報を算出
  const countRows = await applyWhere(
    db.select({ value: sql`COUNT(*)`.as("value") }).from(shops),
    whereClause
  );
  const total = Number(countRows[0]?.value ?? 0);
  const total_pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // 一覧本体を取得。列名はフロントの期待形式に合わせて snake_case に揃える
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
