import { and, inArray, like } from "drizzle-orm";
import { shops } from "../db/schema";

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

export function combineFilters(filters) {
  if (!filters.length) return undefined;
  return filters.length === 1 ? filters[0] : and(...filters);
}

export function applyWhere(builder, condition) {
  return condition ? builder.where(condition) : builder;
}
