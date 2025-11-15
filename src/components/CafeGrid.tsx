import type { Cafe } from "../app/types";
import CafeCard from "./CafeCard";
import Pagination from "./Pagination";

type Props = {
  cafes: Cafe[];
  pages: number[];
  summary: number;
};

export default function CafeGrid({ cafes, pages, summary }: Props) {
  return (
    <section className="max-w-7xl mx-auto px-4 mt-6 space-y-4">
      <p className="text-sm text-coffee-700/80">該当: {summary} 件</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="cards">
        {cafes.map((cafe) => (
          <CafeCard key={cafe.name} cafe={cafe} />
        ))}
      </div>

      <Pagination pages={pages} currentPage={1} />
      <div className="w-full text-center text-sm text-coffee-600 mt-2">1 / {pages.length}ページ</div>
    </section>
  );
}
