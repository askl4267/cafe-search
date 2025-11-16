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

type CountMap = Record<string, number>;
type JsonRecord = Record<string, unknown>;

const toStringValue = (value: unknown, fallback = "") =>
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

export default function Home() {
  const [middleMaster, setMiddleMaster] = useState<MidArea[]>([]);
  const [smallMaster, setSmallMaster] = useState<SmallArea[]>([]);
  const [midCounts, setMidCounts] = useState<CountMap>({});
  const [smallCounts, setSmallCounts] = useState<CountMap>({});
  const [selectedMidCodes, setSelectedMidCodes] = useState<string[]>([]);
  const [selectedSmallCodes, setSelectedSmallCodes] = useState<string[]>([]);
  const [parking, setParking] = useState<"any" | "has" | "none">("any");
  const [smoking, setSmoking] = useState<"any" | "non_smoking" | "has_non_smoking">("any");
  const [cards, setCards] = useState<Cafe[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [areaError, setAreaError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const selectedMidSet = useMemo(() => new Set(selectedMidCodes), [selectedMidCodes]);
  const selectedSmallSet = useMemo(() => new Set(selectedSmallCodes), [selectedSmallCodes]);

type AreaCountEntry = {
  code?: string;
  cnt?: number;
  count?: number;
};

const fetchAreaCounts = useCallback(async () => {
  const params = new URLSearchParams({
    parking,
    smoking,
  });
    if (selectedMidCodes.length) {
      params.set("middle", selectedMidCodes.join(","));
    }
    const response = await fetch(`${API_BASE}/area_counts?${params.toString()}`);
    if (!response.ok) {
      throw new Error("件数の取得に失敗しました");
    }
    const data = await response.json();
    const toCountMap = (entries: AreaCountEntry[] | undefined): CountMap => {
      return (entries || []).reduce((acc, entry) => {
        if (entry?.code) {
          const value = toNumberValue(entry.cnt ?? entry.count, 0);
          acc[entry.code] = value;
        }
        return acc;
      }, {} as CountMap);
    };
    return {
      midMap: toCountMap(data.middle),
      smallMap: toCountMap(data.small),
    };
  }, [parking, smoking, selectedMidCodes]);

  const runSearch = useCallback(
    async (page = 1) => {
      setLoading(true);
      setSearchError(null);
      try {
        const params = new URLSearchParams({
          parking,
          smoking,
          page: String(page),
        });
        if (selectedMidCodes.length) {
          params.set("middle", selectedMidCodes.join(","));
        }
        if (selectedSmallCodes.length) {
          params.set("small", selectedSmallCodes.join(","));
        }
        const response = await fetch(`${API_BASE}/search?${params.toString()}`);
        if (!response.ok) {
          throw new Error("検索結果の取得に失敗しました");
        }
        const data = (await response.json()) as JsonRecord;
        const items = Array.isArray(data.items) ? data.items : [];
        setCards(
          items.map((entry) =>
            mapToCafe((typeof entry === "object" && entry !== null ? entry : {}) as JsonRecord),
          ),
        );
        setTotalResults(toNumberValue(data.total, 0));
        setTotalPages(Math.max(1, toNumberValue(data.total_pages, 1)));
        setCurrentPage(toNumberValue(data.page ?? page, page));
      } catch (error) {
        setCards([]);
        setTotalResults(0);
        setTotalPages(1);
        setCurrentPage(page);
        setSearchError(error instanceof Error ? error.message : "検索結果の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    },
    [parking, smoking, selectedMidCodes, selectedSmallCodes],
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
        setMiddleMaster(data.middle || []);
        setSmallMaster(data.small || []);
        setAreaError(null);
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
    if (!middleMaster.length) {
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
  }, [middleMaster.length, fetchAreaCounts]);

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

  const handlePageChange = useCallback(
    (page: number) => {
      runSearch(page);
    },
    [runSearch],
  );

  const midAreas: MidAreaDisplay[] = useMemo(
    () =>
      middleMaster.map((area) => ({
        ...area,
        count: midCounts[area.code] ?? 0,
        selected: selectedMidSet.has(area.code),
      })),
    [middleMaster, midCounts, selectedMidSet],
  );

  const smallAreaCandidates: SmallAreaDisplay[] = useMemo(() => {
    if (!selectedMidCodes.length) {
      return [];
    }
    return smallMaster
      .map((area) => ({
        ...area,
        count: smallCounts[area.code] ?? 0,
        checked: selectedSmallSet.has(area.code),
      }))
      .filter((area) => (area.count ?? 0) > 0)
      .sort((a, b) => a.name.localeCompare(b.name, "ja"));
  }, [selectedMidCodes.length, selectedSmallSet, smallMaster, smallCounts]);

  return (
    <div className="min-h-screen text-coffee-900">
      <Header />

      <main className="space-y-6 pb-16">
        <FilterPanel
          midAreas={midAreas}
          onToggleMidArea={handleMidToggle}
          smallAreas={smallAreaCandidates}
          showSmallPanel={Boolean(selectedMidCodes.length)}
          onToggleSmallArea={handleSmallToggle}
          parking={parking}
          smoking={smoking}
          onParkingChange={(value) => setParking(value as typeof parking)}
          onSmokingChange={(value) => setSmoking(value as typeof smoking)}
          onSearch={() => runSearch(1)}
        />
        {areaError && (
          <div className="max-w-7xl mx-auto px-4 text-sm text-red-600">
            {areaError}
          </div>
        )}
        <CafeGrid
          cafes={cards}
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
