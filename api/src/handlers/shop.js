import { eq } from "drizzle-orm";
import { json } from "../utils/response";
import { shops } from "../db/schema";

export async function handleShop(req, env, db) {
  const url = new URL(req.url);
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
