import { and, inArray, like } from "drizzle-orm";
import { shops } from "../db/schema";

/**
 * 中エリア・小エリア・設備条件から WHERE 句配列を構築する。
 * drizzle の inArray/like を使い、空配列は無視する。
 */
export function buildSearchFilters({ middle = [], small = [], parking, smoking }) {
  const filters = [];
  if (Array.isArray(middle) && middle.length) {
    filters.push(inArray(shops.middleAreaCode, middle));
  }
  if (Array.isArray(small) && small.length) {
    filters.push(inArray(shops.smallAreaCode, small));
  }
  filters.push(...buildAmenityFilters({ parking, smoking }));
  return filters;
}

/**
 * 駐車・禁煙情報から like 条件を組み立てる。
 * DB には文言が埋め込まれているため、部分一致で拾う。
 */
export function buildAmenityFilters({ parking, smoking }) {
  const filters = [];
  if (parking === "has") {
    filters.push(like(shops.parking, "%駐車%"));
  }
  if (parking === "none") {
    filters.push(like(shops.parking, "%なし%"));
  }
  if (smoking === "non_smoking") {
    filters.push(like(shops.nonSmoking, "%全席禁煙%"));
  }
  if (smoking === "has_non_smoking") {
    filters.push(like(shops.nonSmoking, "%禁煙%"));
  }
  return filters;
}

/**
 * WHERE 句配列を drizzle の and 句にまとめる。
 */
export function combineFilters(filters) {
  if (!filters.length) return undefined;
  return filters.length === 1 ? filters[0] : and(...filters);
}

/**
 * 条件がある場合のみ where を適用し、無ければ builder をそのまま返す。
 */
export function applyWhere(builder, condition) {
  return condition ? builder.where(condition) : builder;
}
