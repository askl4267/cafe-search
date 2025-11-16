import { and, inArray, like } from "drizzle-orm";
import { shops } from "./db/schema";

export type EntranceFilters = {
  middle?: string[];
  small?: string[];
  parking: "any" | "has" | "none";
  smoking: "any" | "non_smoking" | "has_non_smoking";
};

export function buildSearchFilters(filters: EntranceFilters) {
  const result = [];
  if (Array.isArray(filters.middle) && filters.middle.length) {
    result.push(inArray(shops.middleAreaCode, filters.middle));
  }
  if (Array.isArray(filters.small) && filters.small.length) {
    result.push(inArray(shops.smallAreaCode, filters.small));
  }
  result.push(...buildAmenityFilters(filters));
  return result;
}

export function buildAmenityFilters({
  parking,
  smoking,
}: EntranceFilters) {
  const result = [];
  if (parking === "has") {
    result.push(like(shops.parking, "%駐車%"));
  }
  if (parking === "none") {
    result.push(like(shops.parking, "%なし%"));
  }
  if (smoking === "non_smoking") {
    result.push(like(shops.nonSmoking, "%全席禁煙%"));
  }
  if (smoking === "has_non_smoking") {
    result.push(like(shops.nonSmoking, "%禁煙%"));
  }
  return result;
}

export function combineFilters(filters: ReturnType<typeof buildSearchFilters>) {
  if (!filters.length) return undefined;
  return filters.length === 1 ? filters[0] : and(...filters);
}
