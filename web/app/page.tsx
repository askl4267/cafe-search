'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FilterPanel from '../components/FilterPanel';
import Pagination from '../components/Pagination';
import SearchSkeleton from '../components/SearchSkeleton';
import ShopCard from '../components/ShopCard';

const DEFAULT_API_BASE = 'https://cafe-search-api.askl4267.workers.dev';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? DEFAULT_API_BASE;

type AreaItem = {
  code: string;
  name: string;
};

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

type SearchResult = {
  items: ShopSummary[];
  total: number;
  page: number;
  total_pages: number;
};

type AreaCounts = {
  midMap: Record<string, number>;
  smallMap: Record<string, number>;
};

const parkingOptions = [
  { value: 'any', label: '指定なし' },
  { value: 'has', label: 'あり' },
  { value: 'none', label: 'なし' },
];

const smokingOptions = [
  { value: 'any', label: '指定なし' },
  { value: 'non_smoking', label: '全面禁煙' },
  { value: 'has_non_smoking', label: '禁煙席あり' },
];

export default function HomePage() {
  const [middleAreas, setMiddleAreas] = useState<AreaItem[]>([]);
  const [smallAreas, setSmallAreas] = useState<AreaItem[]>([]);
  const [selectedMids, setSelectedMids] = useState<string[]>([]);
  const [selectedSmalls, setSelectedSmalls] = useState<string[]>([]);
  const [parking, setParking] = useState<string>('any');
  const [smoking, setSmoking] = useState<string>('any');
  const [areaCounts, setAreaCounts] = useState<AreaCounts>({ midMap: {}, smallMap: {} });
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const requestId = useRef(0);
  const mounted = useRef(false);

  const fetchAreaCounts = useCallback(async () => {
    const params = new URLSearchParams({ parking, smoking });
    if (selectedMids.length) {
      params.set('middle', selectedMids.join(','));
    }
    const res = await fetch(`${API_BASE}/area_counts?${params}`);
    if (!res.ok) {
      throw new Error('area_counts で失敗');
    }
    const json = await res.json();
    return {
      midMap: Object.fromEntries((json.middle ?? []).map((m: any) => [m.code, m.cnt])),
      smallMap: Object.fromEntries((json.small ?? []).map((s: any) => [s.code, s.cnt])),
    } as AreaCounts;
  }, [parking, selectedMids, smoking]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/areas`);
        const json = await res.json();
        if (!active) return;
        setMiddleAreas(json.middle ?? []);
        setSmallAreas(json.small ?? []);
      } catch (err) {
        console.error(err);
        if (active) {
          setError('エリア情報の取得に失敗しました');
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetchAreaCounts()
      .then((counts) => {
        if (!active) return;
        setAreaCounts(counts);
      })
      .catch((err) => {
        console.error(err);
        if (active) {
          setError('エリア件数の取得に失敗しました');
        }
      });
    return () => {
      active = false;
    };
  }, [fetchAreaCounts]);

  useEffect(() => {
    if (!selectedMids.length && selectedSmalls.length) {
      setSelectedSmalls([]);
    }
  }, [selectedMids, selectedSmalls.length]);

  const runSearch = useCallback(
    async (page = 1) => {
      const id = ++requestId.current;
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(page),
          parking,
          smoking,
        });
        if (selectedMids.length) {
          params.set('middle', selectedMids.join(','));
        }
        if (selectedSmalls.length) {
          params.set('small', selectedSmalls.join(','));
        }
        const res = await fetch(`${API_BASE}/search?${params}`);
        if (!res.ok) {
          throw new Error('search api error');
        }
        const json = await res.json();
        if (requestId.current !== id) return;
        setResult({
          items: json.items ?? [],
          total: json.total ?? 0,
          page: json.page ?? 1,
          total_pages: json.total_pages ?? 1,
        });
        setCurrentPage(json.page ?? 1);
      } catch (err) {
        console.error(err);
        if (requestId.current === id) {
          setError('検索結果の取得に失敗しました');
        }
      } finally {
        if (requestId.current === id) {
          setLoading(false);
        }
      }
    },
    [parking, selectedMids, selectedSmalls, smoking]
  );

  useEffect(() => {
    if (!mounted.current) {
      runSearch(1);
      mounted.current = true;
    }
  }, [runSearch]);

  const toggleMid = useCallback((code: string) => {
    setSelectedMids((prev) =>
      prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code]
    );
  }, []);

  const toggleSmall = useCallback((code: string) => {
    setSelectedSmalls((prev) =>
      prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code]
    );
  }, []);

  const handleParkingChange = useCallback((value: string) => {
    setParking(value);
  }, []);

  const handleSmokingChange = useCallback((value: string) => {
    setSmoking(value);
  }, []);

  const resultSummary = useMemo(() => {
    if (!result) return '該当: 0 件';
    return `該当: ${result.total} 件（${result.page} / ${result.total_pages}）`;
  }, [result]);

  return (
    <div className="py-6">
      <section className="border-b border-coffee-100">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 sm:py-12">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl text-coffee-800">今日はどんなカフェ気分？</h1>
            <p className="text-coffee-700/80 mt-2">
              エリア・駐車・禁煙で絞って、雰囲気の合うお店を見つけよう。
            </p>
          </div>
          <div className="bg-cream-50/70 border border-coffee-200 rounded-2xl shadow-card p-4 sm:p-6">
            <FilterPanel
              middleAreas={middleAreas}
              smallAreas={smallAreas}
              areaCounts={areaCounts}
              selectedMids={selectedMids}
              selectedSmalls={selectedSmalls}
              parking={parking}
              smoking={smoking}
              onToggleMid={toggleMid}
              onToggleSmall={toggleSmall}
              onParkingChange={handleParkingChange}
              onSmokingChange={handleSmokingChange}
              onSearch={() => runSearch(1)}
              parkingOptions={parkingOptions}
              smokingOptions={smokingOptions}
              disabled={loading}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6">
        <p className="text-sm text-coffee-700/80 mb-2">{resultSummary}</p>
        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading && <SearchSkeleton count={6} />}
          {!loading && result?.items.length ? (
            result.items.map((shop) => <ShopCard key={shop.id} shop={shop} />)
          ) : null}
          {!loading && result && result.items.length === 0 && (
            <p className="col-span-full rounded-2xl border border-cream-300 bg-white/80 p-6 text-center text-sm text-coffee-600">
              条件に一致するお店が見つかりませんでした。
            </p>
          )}
        </div>
        {result && result.total_pages > 1 && (
          <div className="mt-6">
            <Pagination
              page={currentPage}
              totalPages={result.total_pages}
              onPageChange={(page) => runSearch(page)}
            />
          </div>
        )}
      </section>
    </div>
  );
}
