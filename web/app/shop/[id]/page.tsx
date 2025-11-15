import Link from 'next/link';
import { notFound } from 'next/navigation';

const DEFAULT_API_BASE = 'https://cafe-search-api.askl4267.workers.dev';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? DEFAULT_API_BASE;

type ShopDetail = {
  id: string;
  name?: string;
  catch_text?: string;
  address?: string;
  lat?: string;
  lng?: string;
  urls_pc?: string;
  photo_l?: string;
  name_kana?: string;
  middle_area_name?: string;
  small_area_name?: string;
  budget_avg?: number;
  capacity?: number;
  open_text?: string;
  close_text?: string;
  updated_at?: string;
  non_smoking?: string;
  wifi?: string;
  parking?: string;
};

const fmt = (value: string | number | undefined | null, fallback = '-') => {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value);
};

const formatCurrency = (value: number | string | undefined | null) => {
  if (value === undefined || value === null) return '不明';
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return '不明';
  return `¥${num.toLocaleString()}`;
};

const createMapLink = (shop: ShopDetail) => {
  if (shop.lat && shop.lng) {
    return `https://www.google.com/maps/search/?api=1&query=${shop.lat},${shop.lng}`;
  }
  if (shop.address) {
    return `https://www.google.com/maps/search/${encodeURIComponent(shop.address)}`;
  }
  return 'https://www.google.com/maps/search/Osaka+Cafe';
};

const placeholderImage = 'https://placehold.co/800x600?text=Cafe';

async function fetchShop(id: string) {
  const url = `${API_BASE}/shop?id=${encodeURIComponent(id)}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) {
    return null;
  }
  const json = await res.json();
  return json.item as ShopDetail | null;
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const shop = await fetchShop(params.id);
  if (!shop) {
    return { title: '店舗が見つかりません' };
  }
  return {
    title: `${shop.name ?? 'カフェ'} | Osaka Cafe Finder`,
    description: shop.catch_text ?? '大阪のカフェ情報',
  };
}

export default async function ShopPage({ params }: { params: { id: string } }) {
  const shop = await fetchShop(params.id);
  if (!shop) {
    notFound();
  }

  const badges = ([] as string[])
    .concat(shop.non_smoking ? [`禁煙: ${shop.non_smoking}`] : [])
    .concat(shop.wifi ? [`Wi-Fi: ${shop.wifi}`] : [])
    .concat(shop.parking ? [`駐車: ${shop.parking}`] : []);

  const updatedAtLabel = (() => {
    if (!shop.updated_at) return 'N/A';
    const timestamp = Number(shop.updated_at);
    if (Number.isNaN(timestamp)) return 'N/A';
    const date = new Date(timestamp * 1000);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  })();

  return (
    <div className="py-6">
      <div className="mx-auto max-w-5xl space-y-6 px-4 sm:py-8">
        <header className="sticky top-[calc(0px)] z-20 rounded-2xl border border-coffee-200 bg-cream-100/80 p-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-coffee-700 hover:underline">
              ← 一覧に戻る
            </Link>
            <span className="ml-auto text-xs text-coffee-500">Powered by Hot Pepper</span>
          </div>
        </header>

        <section className="bg-cream-50/70 border border-coffee-200 rounded-2xl overflow-hidden">
          <div className="h-56 w-full bg-cream-200 skeleton sm:h-80">
            <img
              src={shop.photo_l ?? placeholderImage}
              alt={shop.name ?? 'カフェ'}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="p-4 sm:p-6">
            <h1 className="font-display text-2xl sm:text-3xl text-coffee-800">{shop.name ?? '—'}</h1>
            {shop.catch_text && <p className="mt-1 text-coffee-700/90">{shop.catch_text}</p>}
            <div className="mt-4 flex flex-wrap gap-2" aria-label="設備情報">
              {badges.length
                ? badges.map((label) => (
                    <span
                      key={label}
                      className="inline-flex items-center rounded-lg border border-coffee-200 bg-white px-2 py-1 text-xs text-coffee-800"
                    >
                      {label}
                    </span>
                  ))
                : (
                    <span className="inline-flex items-center rounded-lg border border-coffee-200 bg-white px-2 py-1 text-xs text-coffee-800">
                      設備情報 不明
                    </span>
                  )}
            </div>
            {shop.address && (
              <p className="mt-3 text-sm text-coffee-700">{shop.address}</p>
            )}
            <div className="mt-1">
              <a
                href={createMapLink(shop)}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-coffee-700 underline"
              >
                Googleマップで開く
              </a>
            </div>
            <div className="mt-4 flex gap-2">
              <a
                href={shop.urls_pc ?? '#'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-lg bg-coffee-600 px-3 py-1.5 text-sm text-white transition hover:bg-coffee-700"
              >
                HotPepperで見る
              </a>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <article className="lg:col-span-2 space-y-3 rounded-2xl border border-coffee-200 bg-cream-50/70 p-4 sm:p-6">
            <h2 className="font-semibold text-coffee-800">店舗情報</h2>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-3">
              <dt className="text-sm text-coffee-600">店名（かな）</dt>
              <dd className="sm:col-span-2">{fmt(shop.name_kana)}</dd>

              <dt className="text-sm text-coffee-600">エリア</dt>
              <dd className="sm:col-span-2">
                {[shop.middle_area_name, shop.small_area_name].filter(Boolean).join(' / ') || '不明'}
              </dd>

              <dt className="text-sm text-coffee-600">予算目安</dt>
              <dd className="sm:col-span-2">{formatCurrency(shop.budget_avg)}</dd>

              <dt className="text-sm text-coffee-600">席数</dt>
              <dd className="sm:col-span-2">{shop.capacity ? `${shop.capacity}席` : '不明'}</dd>

              <dt className="text-sm text-coffee-600">営業時間</dt>
              <dd className="sm:col-span-2 whitespace-pre-wrap">{fmt(shop.open_text)}</dd>

              <dt className="text-sm text-coffee-600">定休日</dt>
              <dd className="sm:col-span-2 whitespace-pre-wrap">{fmt(shop.close_text)}</dd>
            </dl>
          </article>
          <aside className="rounded-2xl border border-coffee-200 bg-cream-50/70 p-4 sm:p-6">
            <h2 className="font-semibold text-coffee-800">写真</h2>
            <div className="mt-2 aspect-[4/3] overflow-hidden rounded-xl bg-cream-200">
              <img
                src={shop.photo_l ?? placeholderImage}
                alt={shop.name ?? 'カフェ'}
                className="h-full w-full object-cover"
              />
            </div>
          </aside>
        </section>

        <section className="text-xs text-coffee-600">
          データ提供: Recruit Hot Pepper / 最終更新: {updatedAtLabel}
        </section>
      </div>
    </div>
  );
}
