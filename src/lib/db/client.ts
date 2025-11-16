import { drizzle } from "drizzle-orm/d1";
import { schema } from "./schema";

let cached: ReturnType<typeof drizzle> | null = null;
let cachedDb: D1Database | null = null;

export type D1Database = Parameters<typeof drizzle>[0];

declare global {
  const DB: D1Database;
}

export function getDb(db?: D1Database) {
  const targetDb = db ?? (globalThis as typeof globalThis & { DB?: D1Database }).DB;
  if (!targetDb) {
    throw new Error("D1 database binding is not available");
  }
  if (cached && cachedDb === targetDb) {
    return cached;
  }
  cachedDb = targetDb;
  cached = drizzle(targetDb, { schema });
  return cached;
}
