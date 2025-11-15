import { sql } from "drizzle-orm";
import { json } from "../utils/response";
import { shops } from "../db/schema";
import { buildAmenityFilters, combineFilters, applyWhere } from "../utils/filters";

export async function handleAreasTree(req, env, db) {
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
      small: m.small.sort((a, b) =>
        (a.name || "").localeCompare(b.name || "", "ja")
      ),
    }))
    .sort((a, b) => (a.name || "").localeCompare(b.name || "", "ja"));

  return json({ middle });
}
