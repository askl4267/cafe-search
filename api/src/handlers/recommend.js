// api/src/handlers/recommend.js
import { and, eq, ne, sql } from "drizzle-orm";
import { json } from "../utils/response";
import { shops } from "../db/schema";

export async function handleRecommend(req, env, db) {
  const url = new URL(req.url);

  const area = url.searchParams.get("area"); // middle_area_code
  const logic = url.searchParams.get("logic") || "random";
  const numParam = url.searchParams.get("num");
  const excludeId = url.searchParams.get("exclude_id"); // 閲覧中ショップID（任意）

  // 必須パラメータチェック
  if (!area) {
    return json({ error: "missing area (middle_area_code)" }, 400);
  }

  // num のバリデーション（デフォルト 4 / 最大 20 件くらいに制限）
  let num = Number.parseInt(numParam ?? "4", 10);
  if (Number.isNaN(num) || num <= 0) num = 4;
  if (num > 20) num = 20;

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