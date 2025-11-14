import { sql } from "drizzle-orm";
import { applyWhere, buildSearchFilters, combineFilters } from "../utils/filters";
import { shops } from "../db/schema";
import { json } from "../utils/response";

const PAGE_SIZE = 15;

export async function handleSearch(req, env, db) {
  const url = new URL(req.url);

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
