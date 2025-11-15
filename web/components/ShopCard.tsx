'use client';

import Link from 'next/link';

type ShopSummary = {
  id: string;
  name: string;
  address?: string;
  urls_pc?: string;
  photo_l?: string;
  wifi?: string;
  parking?: string;
  non_smoking?: string;
};

const placeholderImage = 'https://placehold.co/600x450?text=Cafe';

export default function ShopCard({ shop }: { shop: ShopSummary }) {
  const infoLine = `禁煙: ${shop.non_smoking ?? '不明'} ／ Wi-Fi: ${shop.wifi ?? '不明'} ／ 駐車: ${shop.parking ?? '不明'}`;
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-cream-100/80 shadow-card">
      <div className="overflow-hidden">
        <img
          src={shop.photo_l ?? placeholderImage}
          alt={shop.name}
          className="thumb w-full"
          loading="lazy"
        />
      </div>
      <div className="flex h-full flex-1 flex-col gap-2 p-4">
        <h3 className="font-semibold text-coffee-800 line-clamp-2 min-h-[2.5rem]">{shop.name}</h3>
        {shop.address ? (
          <p className="text-sm text-coffee-700 line-clamp-2 min-h-[2.5rem]">{shop.address}</p>
        ) : (
          <p className="text-sm text-coffee-600">住所情報なし</p>
        )}
        <p className="text-xs text-coffee-600">{infoLine}</p>
        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          <Link
            href={`/shop/${encodeURIComponent(shop.id)}`}
            className="inline-flex items-center gap-1 rounded-lg border border-coffee-200 bg-white px-3 py-1.5 text-sm text-coffee-800 transition hover:bg-cream-200/60"
          >
            詳細を見る
          </Link>
          {shop.urls_pc && (
            <Link
              href={shop.urls_pc}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-lg bg-coffee-600 px-3 py-1.5 text-sm text-white transition hover:bg-coffee-700"
            >
              HotPepperで見る
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
