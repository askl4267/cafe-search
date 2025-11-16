import { NextRequest, NextResponse } from "next/server";
import { inArray, sql } from "drizzle-orm";
import { getDb } from "../../../lib/db/client";
import { shops } from "../../../lib/db/schema";
import { buildAmenityFilters, combineFilters } from "../../../lib/filters";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const selectedMiddle = (url.searchParams.get("middle") ?? "")
    .split(",")
    .filter(Boolean);
  const parking = (url.searchParams.get("parking") ?? "any") as Filters["parking"];
  const smoking = (url.searchParams.get("smoking") ?? "any") as Filters["smoking"];

  const baseFilters = buildAmenityFilters({ parking, smoking } as Filters);
  const middleWhere = combineFilters(baseFilters);

  const db = getDb();

  const middleQuery = db
    .select({
      code: shops.middleAreaCode,
      cnt: sql`COUNT(*)`.as("cnt"),
    })
    .from(shops);
  const middleRows = (await (middleWhere
    ? middleQuery.where(middleWhere).groupBy(shops.middleAreaCode)
    : middleQuery.groupBy(shops.middleAreaCode))) as Array<{ code?: string; cnt?: number }>;

  const smallFilters = [...baseFilters];
  if (selectedMiddle.length) {
    smallFilters.push(inArray(shops.middleAreaCode, selectedMiddle));
  }
  const smallWhere = combineFilters(smallFilters);

  const smallQuery = db
    .select({
      code: shops.smallAreaCode,
      cnt: sql`COUNT(*)`.as("cnt"),
    })
    .from(shops);
  const smallRows = (await (smallWhere
    ? smallQuery.where(smallWhere).groupBy(shops.smallAreaCode)
    : smallQuery.groupBy(shops.smallAreaCode))) as Array<{ code?: string; cnt?: number }>;

  return NextResponse.json({
    middle: (middleRows ?? []).filter((row) => row.code),
    small: (smallRows ?? []).filter((row) => row.code),
  });
}

type Filters = Parameters<typeof buildAmenityFilters>[0];
