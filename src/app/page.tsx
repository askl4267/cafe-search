"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  Cafe,
  MidArea,
  SmallArea,
  MidAreaDisplay,
  SmallAreaDisplay,
} from "./types";
import Header from "../components/Header";
import FilterPanel from "../components/FilterPanel";
import CafeGrid from "../components/CafeGrid";

const API_BASE = "https://cafe-search-api.askl4267.workers.dev";
const placeholderImage = "https://placehold.co/600x450?text=Cafe";

type ParkingFilter = "any" | "has" | "none";
type SmokingFilter = "any" | "non_smoking" | "has_non_smoking";
type CountMap = Record<string, number>;
type JsonRecord = Record<string, unknown>;

type AreaCountEntry = {
  code?: string;
  cnt?: number;
  count?: number;
};

type AreaCountsResponse = {
  middle?: AreaCountEntry[];
  small?: AreaCountEntry[];
};

type SearchResponse = {
  items?: unknown;
  total?: unknown;
  total_pages?: unknown;
  page?: unknown;
};

const toStringValue = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

const toNumberValue = (value: unknown, fallback: number) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const asRecord = (value: unknown): JsonRecord | undefined => {
  if (typeof value === "object" && value !== null) {
    return value as JsonRecord;
  }
  return undefined;
};

const mapToCafe = (item: JsonRecord): Cafe => {
  // APIの写真URLは階層が深く揺れがあるため、取得できる順に優先度を決めて拾う
  const record = item;
  const photoL = toStringValue(record["photo_l"]);
  const photoRecord = asRecord(record["photo"]);
  const photoPc = photoRecord ? asRecord(photoRecord["pc"]) : undefined;
  const nestedImage = photoPc ? toStringValue(photoPc["l"]) : "";
  return {
    id: toStringValue(record["id"], ""),
    name: toStringValue(record["name"], "Unnamed Cafe"),
    description: toStringValue(record["catch"] ?? record["description"]),
    address: toStringValue(record["address"]),
    parking: toStringValue(record["parking"], "不明"),
    wifi: toStringValue(record["wifi"], "不明"),
    nonSmoking: toStringValue(record["non_smoking"], "不明"),
    image: photoL || nestedImage || placeholderImage,
  };
};

const sortCodes = (codes: string[]) => [...codes].sort((a, b) => a.localeCompare(b));

// API側で件数キーがcnt/countどちらでも届くため、ここで吸収してMapに整形する
const toCountMap = (entries: AreaCountEntry[] | undefined): CountMap =>
  (entries || []).reduce((acc, entry) => {
    if (entry?.code) {
      const value = toNumberValue(entry.cnt ?? entry.count, 0);
      acc[entry.code] = value;
    }
    return acc;
  }, {} as CountMap);

export default function Home() {
  const [middleAreas, setMiddleAreas] = useState<MidArea[]>([]);
  const [smallAreas, setSmallAreas] = useState<SmallArea[]>([]);
  const [midCounts, setMidCounts] = useState<CountMap>({});
  const [smallCounts, setSmallCounts] = useState<CountMap>({});
  const [selectedMidCodes, setSelectedMidCodes] = useState<string[]>([]);
  const [selectedSmallCodes, setSelectedSmallCodes] = useState<string[]>([]);
  const [parking, setParking] = useState<ParkingFilter>("any");
  const [smoking, setSmoking] = useState<SmokingFilter>("any");
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [areaError, setAreaError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const selectedMidSet = useMemo(() => new Set(selectedMidCodes), [selectedMidCodes]);
  const selectedSmallSet = useMemo(() => new Set(selectedSmallCodes), [selectedSmallCodes]);
  const hasSelectedMiddleArea = selectedMidCodes.length > 0;

  const buildAreaCountParams = useCallback(() => {
    const params = new URLSearchParams({
      parking,
      smoking,
    });
    if (hasSelectedMiddleArea) {
      params.set("middle", selectedMidCodes.join(","));
    }
    return params;
  }, [parking, smoking, hasSelectedMiddleArea, selectedMidCodes]);

  const fetchAreaCounts = useCallback(async () => {
    const params = buildAreaCountParams();
    const response = await fetch(`${API_BASE}/area_counts?${params.toString()}`);
    if (!response.ok) {
      throw new Error("件数の取得に失敗しました");
    }
    const data = (await response.json()) as AreaCountsResponse;
    return {
      midMap: toCountMap(data.middle),
      smallMap: toCountMap(data.small),
    };
  }, [buildAreaCountParams]);

  const buildSearchParams = useCallback(
    (page: number) => {
      const params = new URLSearchParams({
        parking,
        smoking,
        page: String(page),
      });
      if (hasSelectedMiddleArea) {
        params.set("middle", selectedMidCodes.join(","));
      }
      if (selectedSmallCodes.length) {
        params.set("small", selectedSmallCodes.join(","));
      }
      return params;
    },
    [hasSelectedMiddleArea, parking, selectedMidCodes, selectedSmallCodes, smoking],
  );

  const runSearch = useCallback(
    async (page = 1) => {
      setLoading(true);
      setSearchError(null);
      try {
        const params = buildSearchParams(page);
        const response = await fetch(`${API_BASE}/search?${params.toString()}`);
        if (!response.ok) {
          throw new Error("検索結果の取得に失敗しました");
        }
        const data = (await response.json()) as SearchResponse;
        const items = Array.isArray(data.items) ? data.items : [];
        setCafes(
          items.map((entry) =>
            mapToCafe((typeof entry === "object" && entry !== null ? entry : {}) as JsonRecord),
          ),
        );
        setTotalResults(toNumberValue(data.total, 0));
        setTotalPages(Math.max(1, toNumberValue(data.total_pages, 1)));
        setCurrentPage(toNumberValue(data.page ?? page, page));
      } catch (error) {
        setCafes([]);
        setTotalResults(0);
        setTotalPages(1);
        setCurrentPage(page);
        setSearchError(error instanceof Error ? error.message : "検索結果の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    },
    [buildSearchParams],
  );

  const runSearchRef = useRef(runSearch);
  useEffect(() => {
    runSearchRef.current = runSearch;
  }, [runSearch]);

  useEffect(() => {
    let cancelled = false;
    const loadAreas = async () => {
      try {
        const response = await fetch(`${API_BASE}/areas`);
        if (!response.ok) {
          throw new Error("エリア情報の取得に失敗しました");
        }
        const data = await response.json();
        if (cancelled) return;
        setMiddleAreas(data.middle || []);
        setSmallAreas(data.small || []);
        setAreaError(null);
        // 初期表示時だけ検索を走らせるため、最新のコールバックを参照経由で実行する
        await runSearchRef.current(1);
      } catch (error) {
        if (cancelled) return;
        setAreaError(error instanceof Error ? error.message : "エリア情報の取得に失敗しました");
      }
    };
    loadAreas();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!middleAreas.length) {
      return;
    }
    let alive = true;
    setAreaError(null);
    fetchAreaCounts()
      .then(({ midMap, smallMap }) => {
        if (!alive) return;
        setMidCounts(midMap);
        setSmallCounts(smallMap);
      })
      .catch((error) => {
        if (!alive) return;
        setAreaError(error instanceof Error ? error.message : "件数の取得に失敗しました");
      });
    return () => {
      alive = false;
    };
  }, [middleAreas.length, fetchAreaCounts]);

  const handleMidToggle = (code: string) => {
    setSelectedMidCodes((prev) => {
      const exists = prev.includes(code);
      const next = exists ? prev.filter((item) => item !== code) : [...prev, code];
      return sortCodes(next);
    });
  };

  const handleSmallToggle = (code: string, checked: boolean) => {
    setSelectedSmallCodes((prev) => {
      const next = checked ? [...prev, code] : prev.filter((item) => item !== code);
      return sortCodes(next);
    });
  };

  const handleParkingChange = (value: string) => {
    setParking(value as ParkingFilter);
  };

  const handleSmokingChange = (value: string) => {
    setSmoking(value as SmokingFilter);
  };

  const handlePageChange = useCallback(
    (page: number) => {
      runSearch(page);
    },
    [runSearch],
  );

  const midAreas: MidAreaDisplay[] = useMemo(
    () =>
      middleAreas.map((area) => ({
        ...area,
        count: midCounts[area.code] ?? 0,
        selected: selectedMidSet.has(area.code),
      })),
    [midCounts, middleAreas, selectedMidSet],
  );

  const smallAreaCandidates: SmallAreaDisplay[] = useMemo(() => {
    if (!hasSelectedMiddleArea) {
      return [];
    }
    return smallAreas
      .map((area) => ({
        ...area,
        count: smallCounts[area.code] ?? 0,
        checked: selectedSmallSet.has(area.code),
      }))
      .filter((area) => (area.count ?? 0) > 0)
      .sort((a, b) => a.name.localeCompare(b.name, "ja"));
  }, [hasSelectedMiddleArea, selectedSmallSet, smallAreas, smallCounts]);

  return (
    <div className="min-h-screen text-coffee-900">
      <Header />

      <main className="space-y-6 pb-16">
        <FilterPanel
          midAreas={midAreas}
          onToggleMidArea={handleMidToggle}
          smallAreas={smallAreaCandidates}
          showSmallPanel={hasSelectedMiddleArea}
          onToggleSmallArea={handleSmallToggle}
          parking={parking}
          smoking={smoking}
          onParkingChange={handleParkingChange}
          onSmokingChange={handleSmokingChange}
          onSearch={() => runSearch(1)}
        />
        {areaError && (
          <div className="max-w-7xl mx-auto px-4 text-sm text-red-600">
            {areaError}
          </div>
        )}
        <CafeGrid
          cafes={cafes}
          summary={totalResults}
          loading={loading}
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          errorMessage={searchError}
        />
      </main>
    </div>
  );
}
