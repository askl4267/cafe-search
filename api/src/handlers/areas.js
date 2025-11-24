import { isNotNull, sql } from "drizzle-orm";
import { json } from "../utils/response";
import { shops } from "../db/schema";

export async function handleAreas(req, env, db) {
  // middle/small いずれも null を除外し、名称が無い場合はコードを名称として返す
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

  // UI での表示を考慮し、名称昇順に整列する
  const middle = middleRows
    .filter((r) => r.code)
    .sort((a, b) => (a.name || "").localeCompare(b.name || "", "ja"));
  const small = smallRows
    .filter((r) => r.code)
    .sort((a, b) => (a.name || "").localeCompare(b.name || "", "ja"));

  return json({ middle, small });
}
