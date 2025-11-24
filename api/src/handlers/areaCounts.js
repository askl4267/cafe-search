import { inArray, sql } from "drizzle-orm";
import { json } from "../utils/response";
import { shops } from "../db/schema";
import { buildAmenityFilters, combineFilters, applyWhere } from "../utils/filters";
import { parseListParam, parseStringParam } from "../utils/query";

export async function handleAreaCounts(req, env, db) {
  const url = new URL(req.url);
  const selectedMiddle = parseListParam(url, "middle");
  const parking = parseStringParam(url, "parking", "any");
  const smoking = parseStringParam(url, "smoking", "any");

  const baseFilters = buildAmenityFilters({ parking, smoking });
  const middleWhere = combineFilters(baseFilters);

  // 中エリア件数の集計
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

  // 小エリア件数の集計（選択中の中エリアがあれば限定する）
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
