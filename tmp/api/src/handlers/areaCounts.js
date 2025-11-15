import { inArray, sql } from "drizzle-orm";
import { json } from "../utils/response";
import { shops } from "../db/schema";
import { buildAmenityFilters, combineFilters, applyWhere } from "../utils/filters";

export async function handleAreaCounts(req, env, db) {
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
