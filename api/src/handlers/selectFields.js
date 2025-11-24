import { shops } from "../db/schema";

/**
 * 店舗1件を取得する際に必要なカラム一覧。
 * ハンドラー間で共通化し、取得列の揺れを防ぐ。
 */
export const shopSelectFields = {
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
};
