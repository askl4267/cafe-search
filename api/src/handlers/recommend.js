// api/src/handlers/recommend.js
import { and, eq, ne, sql } from "drizzle-orm";
import { json } from "../utils/response";
import { shops } from "../db/schema";
import { parseBoundedInt, parseStringParam } from "../utils/query";
import { shopSelectFields } from "./selectFields";

export async function handleRecommend(req, env, db) {
  const url = new URL(req.url);

  const area = parseStringParam(url, "area"); // middle_area_code
  const logic = parseStringParam(url, "logic", "random");
  const numParam = url.searchParams.get("num");
  const excludeId = parseStringParam(url, "exclude_id"); // 閲覧中ショップID（任意）

  // 必須パラメータチェック
  if (!area) {
    return json({ error: "missing area (middle_area_code)" }, 400);
  }

  // num のバリデーション（デフォルト 4 / 最大 20 件くらいに制限）
  const num = parseBoundedInt(numParam, { fallback: 4, min: 1, max: 20 });

  // いずれロジック追加を見越しつつ、現状は random のみ許可
  if (logic !== "random") {
    return json({ error: `unsupported logic: ${logic}` }, 400);
  }

  // WHERE 句の組み立て
  let whereExpr = eq(shops.middleAreaCode, area);
  if (excludeId) {
    // 閲覧中ショップを除外
    whereExpr = and(whereExpr, ne(shops.id, excludeId));
  }

  // SQLite の RANDOM() を使ってランダム順に並べて num 件取得
  const rows = await db
    .select(shopSelectFields)
    .from(shops)
    .where(whereExpr)
    .orderBy(sql`RANDOM()`)
    .limit(num);

  return json({
    items: rows,
    meta: {
      area,
      logic,
      requested: num,
      returned: rows.length,
      exclude_id: excludeId ?? null,
    },
  });
}
