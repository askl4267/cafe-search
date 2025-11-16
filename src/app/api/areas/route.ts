import { NextResponse } from "next/server";
import { isNotNull, sql } from "drizzle-orm";
import { getDb } from "../../../lib/db/client";
import { shops } from "../../../lib/db/schema";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const middleRows = (await db
    .selectDistinct({
      code: shops.middleAreaCode,
      name: sql`COALESCE(${shops.middleAreaName}, ${shops.middleAreaCode})`.as("name"),
    })
    .from(shops)
    .where(isNotNull(shops.middleAreaCode)));

  const safeMiddleRows = middleRows as Array<{ code?: string; name?: string }>;

  const smallRows = (await db
    .selectDistinct({
      code: shops.smallAreaCode,
      name: sql`COALESCE(${shops.smallAreaName}, ${shops.smallAreaCode})`.as("name"),
    })
    .from(shops)
    .where(isNotNull(shops.smallAreaCode)));

  const safeSmallRows = smallRows as Array<{ code?: string; name?: string }>;

  const middle = safeMiddleRows
    .filter((row) => row.code)
    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", "ja"));
  const small = safeSmallRows
    .filter((row) => row.code)
    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", "ja"));

  return NextResponse.json({ middle, small });
}
