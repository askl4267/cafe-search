import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "../../../lib/db/client";
import { shops } from "../../../lib/db/schema";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }

  const db = getDb();
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
  if (!row) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ item: row });
}
