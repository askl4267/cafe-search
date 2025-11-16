import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "../../../lib/db/client";
import { shops } from "../../../lib/db/schema";
import { buildAmenityFilters, combineFilters } from "../../../lib/filters";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const parking = (url.searchParams.get("parking") ?? "any") as Filters["parking"];
  const smoking = (url.searchParams.get("smoking") ?? "any") as Filters["smoking"];

  const whereClause = combineFilters(
    buildAmenityFilters({ parking, smoking } as Filters),
  );

  const db = getDb();

  const middleBase = db
    .select({
      code: shops.middleAreaCode,
      name: sql`COALESCE(${shops.middleAreaName}, ${shops.middleAreaCode})`.as("name"),
      cnt: sql`COUNT(*)`.as("cnt"),
    })
    .from(shops);
  const middleRows = (await (whereClause
    ? middleBase.where(whereClause).groupBy(shops.middleAreaCode, shops.middleAreaName)
    : middleBase.groupBy(shops.middleAreaCode, shops.middleAreaName))) as Array<{
    code?: string;
    name?: string;
    cnt?: number;
  }>;

  const smallBase = db
    .select({
      middle: shops.middleAreaCode,
      code: shops.smallAreaCode,
      name: sql`COALESCE(${shops.smallAreaName}, ${shops.smallAreaCode})`.as("name"),
      cnt: sql`COUNT(*)`.as("cnt"),
    })
    .from(shops);
  const smallRows = (await (whereClause
    ? smallBase
        .where(whereClause)
        .groupBy(shops.middleAreaCode, shops.smallAreaCode, shops.smallAreaName)
    : smallBase.groupBy(shops.middleAreaCode, shops.smallAreaCode, shops.smallAreaName))) as Array<{
    middle?: string;
    code?: string;
    name?: string;
    cnt?: number;
  }>;

  const aggregated = new Map<string, AreaTree>();

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
    .map((item) => ({
      ...item,
      small: item.small.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", "ja")),
    }))
    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", "ja"));

  return NextResponse.json({ middle });
}

type Filters = Parameters<typeof buildAmenityFilters>[0];

type AreaTree = {
  code: string;
  name: string;
  cnt: number;
  small: {
    code: string;
    name: string;
    cnt: number;
  }[];
};
