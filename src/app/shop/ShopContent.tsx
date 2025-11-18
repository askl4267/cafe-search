"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import CafeCard from "../../components/CafeCard";
import type { Cafe } from "../types";

const API_BASE = "https://cafe-search-api.askl4267.workers.dev";
const placeholderImage = "https://placehold.co/900x675?text=Osaka+Cafe+Finder";
const cardPlaceholderImage = "https://placehold.co/600x450?text=Cafe";
const RECOMMEND_ITEM_COUNT = 6;

type Shop = {
  id: string;
  name: string;
  name_kana?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  large_area_code?: string | null;
  middle_area_code?: string | null;
  small_area_code?: string | null;
  genre_code?: string | null;
  budget_avg?: number | null;
  capacity?: number | null;
  non_smoking?: string | null;
  wifi?: string | null;
  parking?: string | null;
  open_text?: string | null;
  close_text?: string | null;
  catch_text?: string | null;
  urls_pc?: string | null;
  photo_l?: string | null;
  updated_at?: number | string | null;
  middle_area_name?: string | null;
  small_area_name?: string | null;
};

type ShopResponse = {
  item?: Shop;
  error?: string;
};

const formatText = (value: string | number | null | undefined, fallback = "未設定") => {
  if (value === undefined || value === null) return fallback;
  const str = String(value).trim();
  return str ? str : fallback;
};

const formatBudget = (value: number | string | null | undefined) => {
  if (value === undefined || value === null) return "未設定";
  const num = Number(value);
  if (Number.isNaN(num)) return "未設定";
  return `¥${num.toLocaleString("ja-JP")}`;
};

const formatCapacity = (value: number | string | null | undefined) => {
  if (value === undefined || value === null) return "未設定";
  const num = Number(value);
  if (Number.isNaN(num)) return "未設定";
  return `${num.toLocaleString("ja-JP")}席`;
};

const formatUpdatedDate = (value: number | string | null | undefined) => {
  if (value === undefined || value === null) return "N/A";
  const num = Number(value);
  if (Number.isNaN(num)) return "N/A";
  const date = new Date(num * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const buildMapUrl = (shop: Shop) => {
  if (shop.lat != null && shop.lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${shop.lat},${shop.lng}`;
  }
  const name = formatText(shop.name, "");
  if (!name) {
    return "https://www.google.com/maps/search/Osaka+Cafe+Finder";
  }
  return `https://www.google.com/maps/search/${encodeURIComponent(name)}`;
};

const mapShopToCafeCard = (shop: Shop): Cafe => ({
  id: shop.id,
  name: formatText(shop.name, "Unnamed Cafe"),
  description: formatText(shop.catch_text, "HotPepperで詳しく見る"),
  address: formatText(shop.address, "住所情報なし"),
  parking: formatText(shop.parking, "不明"),
  wifi: formatText(shop.wifi, "不明"),
  nonSmoking: formatText(shop.non_smoking, "不明"),
  image: shop.photo_l || cardPlaceholderImage,
});

const fetchShopData = async (id: string) => {
  const response = await fetch(`${API_BASE}/shop?id=${encodeURIComponent(id)}`);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "ショップ情報の取得に失敗しました");
  }
  const payload = (await response.json()) as ShopResponse;
  if (!payload.item) {
    throw new Error(payload.error || "対象のカフェが見つかりませんでした");
  }
  return payload.item;
};

export default function ShopContent() {
  const searchParams = useSearchParams();
  const id = searchParams?.get("id") ?? undefined;
  const [shop, setShop] = useState<Shop | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Cafe[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }
    let isMounted = true;
    fetchShopData(id)
      .then((item) => {
        if (!isMounted) return;
        setErrorMessage(null);
        setShop(item);
      })
      .catch((error) => {
        if (!isMounted) return;
        setShop(null);
        setErrorMessage(error instanceof Error ? error.message : "ショップ情報の取得に失敗しました");
      });
    return () => {
      isMounted = false;
    };
  }, [id]);

  const badgeList = useMemo(() => {
    if (!shop) return [];
    return [
      shop.non_smoking ? `禁煙: ${shop.non_smoking}` : null,
      shop.wifi ? `Wi-Fi: ${shop.wifi}` : null,
      shop.parking ? `駐車場: ${shop.parking}` : null,
    ].filter(Boolean) as string[];
  }, [shop]);

  useEffect(() => {
    if (!shop?.middle_area_code) {
      setRecommendations([]);
      setRecommendationsError(null);
      setRecommendationsLoading(false);
      return;
    }

    let active = true;

    const fetchRecommendations = async () => {
      setRecommendationsLoading(true);
      setRecommendationsError(null);
      try {
        const params = new URLSearchParams({
          area: shop.middle_area_code,
          logic: "random",
          num: String(RECOMMEND_ITEM_COUNT),
        });
        if (shop.id) {
          params.set("exclude_id", shop.id);
        }
        const response = await fetch(`${API_BASE}/recommend?${params.toString()}`);
        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || "レコメンド情報の取得に失敗しました");
        }
        const data = (await response.json()) as { items?: Shop[] };
        const items = Array.isArray(data.items) ? data.items : [];
        if (!active) return;
        setRecommendations(items.map(mapShopToCafeCard));
      } catch (error) {
        if (!active) return;
        setRecommendations([]);
        setRecommendationsError(
          error instanceof Error ? error.message : "レコメンド情報の取得に失敗しました",
        );
      } finally {
        if (!active) return;
        setRecommendationsLoading(false);
      }
    };

    fetchRecommendations();

    return () => {
      active = false;
    };
  }, [shop]);

  if (!id) {
    return (
      <div className="min-h-screen bg-cream-100 text-coffee-900">
        <main className="max-w-4xl mx-auto px-4 py-16">
          <p className="text-lg font-semibold text-coffee-800">
            カフェIDが指定されていません
          </p>
          <p className="mt-2 text-coffee-700">
            トップページから店舗を選んで、もう一度お試しください。
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-1 text-sm text-white bg-coffee-600 hover:bg-coffee-700 px-4 py-2 rounded-full"
          >
            トップへ戻る
          </Link>
        </main>
      </div>
    );
  }

  if (!shop && !errorMessage) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-50 bg-cream-100/80 backdrop-blur border-b border-coffee-200">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
            <Link href="/" className="text-sm text-coffee-700 hover:underline">
              &larr; トップに戻る
            </Link>
            <div className="ml-auto text-xs text-coffee-500">Powered by Hot Pepper</div>
          </div>
        </header>
        <main className="flex-grow max-w-5xl mx-auto px-4 py-16 text-center">
          <p className="text-sm text-coffee-600">ショップ情報を読み込み中です…</p>
        </main>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-50 bg-cream-100/80 backdrop-blur border-b border-coffee-200">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
            <Link href="/" className="text-sm text-coffee-700 hover:underline">
              &larr; トップに戻る
            </Link>
            <div className="ml-auto text-xs text-coffee-500">Powered by Hot Pepper</div>
          </div>
        </header>
        <main className="flex-grow max-w-5xl mx-auto px-4 py-16">
          <div className="rounded-2xl border border-coffee-200 bg-cream-50/80 p-6 text-center">
            <p className="text-lg font-semibold text-coffee-800">ショップ情報が取得できません</p>
            <p className="text-coffee-700 mt-2">
              {errorMessage || "お手数ですが、時間をおいて再度お試しください。"}
            </p>
          </div>
        </main>
      </div>
    );
  }

  const heroImage = shop.photo_l || placeholderImage;
  const detailImage = shop.photo_l || placeholderImage;
  const address = formatText(shop.address, "未設定");
  const areaText =
    [shop.middle_area_name, shop.small_area_name].filter(Boolean).join(" / ") || "未設定";

  return (
    <div className="min-h-screen text-coffee-900">
      <header className="sticky top-0 z-50 bg-cream-100/90 backdrop-blur border-b border-coffee-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-sm text-coffee-700 hover:underline">
            &larr; トップに戻る
          </Link>
          <div className="ml-auto text-xs text-coffee-500">Powered by Hot Pepper</div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        <section className="bg-cream-50/70 border border-coffee-200 rounded-2xl overflow-hidden shadow-card">
          <div className="w-full h-56 sm:h-80 bg-cream-200">
            <Image
              src={heroImage}
              alt={shop.name}
              className="w-full h-full object-cover"
              width={1200}
              height={675}
              sizes="(min-width: 640px) 1200px, 100vw"
              priority
              unoptimized
            />
          </div>
          <div className="p-4 sm:p-6">
            <h1 className="font-display text-2xl sm:text-3xl text-coffee-800">
              {shop.name}
            </h1>
            <p className="mt-1 text-coffee-700/90">
              {shop.catch_text || "ようこそ、大阪のカフェへ。"}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {badgeList.length ? (
                badgeList.map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center px-2 py-1 rounded-lg border border-coffee-200 bg-white text-xs text-coffee-800"
                  >
                    {label}
                  </span>
                ))
              ) : (
                <span className="inline-flex items-center px-2 py-1 rounded-lg border border-coffee-200 bg-white text-xs text-coffee-800">
                  登録された設備情報がありません
                </span>
              )}
            </div>

            <div className="mt-3 text-sm text-coffee-700">{address}</div>
            <div className="mt-1">
              <a
                href={buildMapUrl(shop)}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-coffee-700 underline"
              >
                Google マップで見る
              </a>
            </div>

            <div className="mt-4 flex gap-2">
              <a
                href={shop.urls_pc || "#"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm text-white bg-coffee-600 hover:bg-coffee-700 px-3 py-1.5 rounded-lg"
              >
                HotPepperで詳しく見る
              </a>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <article className="lg:col-span-2 bg-cream-50/70 border border-coffee-200 rounded-2xl p-4 sm:p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-coffee-800">店舗情報</h2>
              <p className="text-sm text-coffee-600 mt-1">エリアや予算などを確認いただけます。</p>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
              <dt className="text-coffee-600">ふりがな</dt>
              <dd className="sm:col-span-2 text-coffee-900">{shop.name_kana || "未設定"}</dd>

              <dt className="text-coffee-600">エリア</dt>
              <dd className="sm:col-span-2 text-coffee-900">{areaText}</dd>

              <dt className="text-coffee-600">平均予算</dt>
              <dd className="sm:col-span-2 text-coffee-900">{formatBudget(shop.budget_avg)}</dd>

              <dt className="text-coffee-600">収容人数</dt>
              <dd className="sm:col-span-2 text-coffee-900">{formatCapacity(shop.capacity)}</dd>

              <dt className="text-coffee-600">営業時間（開始）</dt>
              <dd className="sm:col-span-2 text-coffee-900 whitespace-pre-line">
                {shop.open_text || "未設定"}
              </dd>

              <dt className="text-coffee-600">営業時間（終了）</dt>
              <dd className="sm:col-span-2 text-coffee-900 whitespace-pre-line">
                {shop.close_text || "未設定"}
              </dd>
            </dl>
          </article>

          <aside className="bg-cream-50/70 border border-coffee-200 rounded-2xl p-4 sm:p-6 space-y-4">
            <h2 className="text-base font-semibold text-coffee-800">ギャラリー</h2>
            <div className="aspect-[4/3] bg-cream-200 rounded-xl overflow-hidden">
              <Image
                src={detailImage}
                alt={`${shop.name}の外観`}
                className="w-full h-full object-cover"
                width={900}
                height={675}
                sizes="(min-width: 640px) 900px, 100vw"
                unoptimized
              />
            </div>
            <p className="text-xs text-coffee-600">
              最終更新日: {formatUpdatedDate(shop.updated_at)}
            </p>
          </aside>
        </section>

        <section className="bg-cream-50/70 border border-coffee-200 rounded-2xl p-4 sm:p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-coffee-800">
              このエリアのおすすめ
            </h2>
            <p className="text-sm text-coffee-600 mt-1">
              {shop.middle_area_name
                ? `${shop.middle_area_name}のカフェをランダムにピックアップしています。`
                : "周辺エリアのカフェをランダムにピックアップしています。"}
            </p>
          </div>

          {recommendationsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: RECOMMEND_ITEM_COUNT }, (_, index) => (
                <div
                  key={`rec-skel-${index}`}
                  className="skeleton h-[280px] rounded-2xl"
                />
              ))}
            </div>
          ) : recommendations.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((cafe) => (
                <CafeCard key={cafe.id} cafe={cafe} />
              ))}
            </div>
          ) : (
            <p
              className={`text-sm ${
                recommendationsError ? "text-red-600" : "text-coffee-600"
              }`}
            >
              {recommendationsError ??
                "現在、このエリア内でおすすめとして表示できるカフェがありません。"}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
