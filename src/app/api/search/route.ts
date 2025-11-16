import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "../../../lib/db/client";
import { shops } from "../../../lib/db/schema";
import { buildSearchFilters, combineFilters } from "../../../lib/filters";

export const runtime = "edge";
export const dynamic = "force-dynamic";
const PAGE_SIZE = 15;

type EnvFilters = Parameters<typeof buildSearchFilters>[0];

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const middle = (url.searchParams.get("middle") ?? "").split(",").filter(Boolean);
  const small = (url.searchParams.get("small") ?? "").split(",").filter(Boolean);
  const parking = (url.searchParams.get("parking") ?? "any") as EnvFilters["parking"];
  const smoking = (url.searchParams.get("smoking") ?? "any") as EnvFilters["smoking"];
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  const filters = buildSearchFilters({ middle, small, parking, smoking });
  const whereClause = combineFilters(filters);

  const db = getDb();

  const countBase = db.select({ value: sql`COUNT(*)`.as("value") }).from(shops);
  const countRows =
    await (whereClause
      ? countBase.where(whereClause)
      : countBase);
  const total = Number(countRows[0]?.value ?? 0);
  const total_pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const itemsBase = db
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
    .from(shops);
  const itemsQuery = whereClause ? itemsBase.where(whereClause) : itemsBase;
  const items = await itemsQuery.limit(PAGE_SIZE).offset(offset);

  return NextResponse.json({
    total,
    page,
    total_pages,
    page_size: PAGE_SIZE,
    items,
  });
}
