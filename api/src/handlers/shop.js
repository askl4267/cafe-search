import { eq } from "drizzle-orm";
import { json } from "../utils/response";
import { shops } from "../db/schema";
import { parseStringParam } from "../utils/query";
import { shopSelectFields } from "./selectFields";

export async function handleShop(req, env, db) {
  const url = new URL(req.url);
  const id = parseStringParam(url, "id");
  if (!id) return json({ error: "missing id" }, 400);

  const rows = await db
    .select(shopSelectFields)
    .from(shops)
    .where(eq(shops.id, id))
    .limit(1);

  const row = rows[0];
  if (!row) return json({ error: "not found" }, 404);
  return json({ item: row });
}
