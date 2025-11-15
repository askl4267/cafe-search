import type { Cafe } from "../app/types";
import CafeCard from "./CafeCard";
import Pagination from "./Pagination";

type Props = {
  cafes: Cafe[];
  summary: number;
  loading: boolean;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  errorMessage?: string | null;
};

export default function CafeGrid({
  cafes,
  summary,
  loading,
  totalPages,
  currentPage,
  onPageChange,
  errorMessage,
}: Props) {
  const skeletonItems = Array.from({ length: 6 }, (_, index) => (
    <div key={`skeleton-${index}`} className="skeleton h-[220px] rounded-2xl" />
  ));

  return (
    <section className="max-w-7xl mx-auto px-4 mt-6 space-y-4">
      <p className="text-sm text-coffee-700/80">該当: {summary} 件</p>
      {errorMessage && (
        <p className="text-sm text-center text-red-600">{errorMessage}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="cards">
        {loading
          ? skeletonItems
          : cafes.length
          ? cafes.map((cafe) => <CafeCard key={cafe.name} cafe={cafe} />)
          : (
            <div className="col-span-full text-center text-sm text-coffee-600">
              条件に合うカフェが見つかりませんでした。
            </div>
          )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </section>
  );
}
